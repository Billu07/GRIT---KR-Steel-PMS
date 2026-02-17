"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Download, Trash2, Edit, Save, X } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { exportEquipmentJobsPdf } from "@/lib/pdfExport";
import EquipmentModal from "@/components/EquipmentModal";
import JobModal from "@/components/JobModal";

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const equipmentId = params.equipmentId as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equipment, setEquipment] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCriticality, setFilterCriticality] = useState("All");

  // Inline Creation State
  const [isAdding, setIsAdding] = useState(false);
  const [newJob, setNewJob] = useState({
    jobCode: "",
    jobName: "",
    jobType: "Maintenance",
    flag: "",
    dateDone: format(new Date(), "yyyy-MM-dd"),
    hoursWorked: 0,
    plannedHours: 0,
    frequency: "weekly",
    criticality: "medium",
  });
  const [calculated, setCalculated] = useState({
    dateDue: "",
    remainingHours: 0,
    overdueDays: 0,
  });

  // Modals state (JobModal only for editing now)
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingJob, setEditingJob] = useState<any>(null);

  const frequencyDays: { [key: string]: number } = {
    weekly: 7,
    monthly: 30,
    "3-monthly": 90,
    yearly: 365,
    "5-yearly": 1825,
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, equipmentId]);

  // Effect for inline form calculations
  useEffect(() => {
    const daysToAdd = frequencyDays[newJob.frequency] || 0;
    const dateDone = new Date(newJob.dateDone);
    const dueDate = addDays(dateDone, daysToAdd);
    const today = new Date();
    const overdue = differenceInDays(today, dueDate);
    const overdueDays = overdue > 0 ? overdue : 0;
    const remaining = Math.max(0, newJob.plannedHours - newJob.hoursWorked);
    setCalculated({
      dateDue: format(dueDate, "yyyy-MM-dd"),
      overdueDays,
      remainingHours: remaining,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    newJob.dateDone,
    newJob.frequency,
    newJob.plannedHours,
    newJob.hoursWorked,
  ]);

  const fetchData = () => {
    if (categoryId && equipmentId) {
      fetch(`/api/equipment/${categoryId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const foundEq = data.equipment.find(
              (e: any) => e.id.toString() === equipmentId,
            );
            setEquipment(foundEq);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eqJobs = data.jobs.filter(
              (j: any) => j.equipmentId.toString() === equipmentId,
            );
            setJobs(eqJobs);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  };

  // ── EQUIPMENT ACTIONS ──

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateEquipment = async (updatedData: any) => {
    try {
      const res = await fetch(`/api/equipment/detail/${equipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        alert("Equipment updated successfully!");
        fetchData();
        setIsEqModalOpen(false);
      } else {
        alert("Failed to update equipment");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating equipment");
    }
  };

  const handleDeleteEquipment = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this equipment? All associated jobs will be deleted.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/equipment/detail/${equipmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/registry");
      } else {
        alert("Failed to delete equipment");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting equipment");
    }
  };

  // ── JOB ACTIONS ──

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewJob((prev) => ({
      ...prev,
      [name]:
        name.includes("Hours") || name === "hoursWorked"
          ? Number(value)
          : value,
    }));
  };

  const handleCreateJob = async () => {
    try {
      const payload = {
        ...newJob,
        equipmentId,
        dateDue: calculated.dateDue,
        remainingHours: calculated.remainingHours,
        overdueDays: calculated.overdueDays,
      };
      const res = await fetch(`/api/equipment/${categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchData();
        setIsAdding(false);
        setNewJob({
          jobCode: "",
          jobName: "",
          jobType: "Maintenance",
          flag: "",
          dateDone: format(new Date(), "yyyy-MM-dd"),
          hoursWorked: 0,
          plannedHours: 0,
          frequency: "weekly",
          criticality: "medium",
        });
      } else {
        alert("Failed to create job");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating job");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateJob = async (jobData: any) => {
    try {
      if (editingJob) {
        const res = await fetch(`/api/jobs/${editingJob.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });
        if (res.ok) {
          fetchData();
          setIsJobModalOpen(false);
          setEditingJob(null);
        } else {
          alert("Failed to update job");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error updating job");
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData(); // Refresh list
      } else {
        alert("Failed to delete job");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting job");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditJobModal = (job: any) => {
    setEditingJob(job);
    setIsJobModalOpen(true);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        filterCriticality === "All" ||
        job.criticality === filterCriticality.toLowerCase(),
    );
  }, [jobs, filterCriticality]);

  const exportJobsPDF = () => {
    exportEquipmentJobsPdf({ equipment, jobs: filteredJobs });
  };

  const criticalityStyle = (c: string) => {
    if (c === "high")
      return {
        color: "#8B2020",
        bg: "rgba(139,32,32,0.07)",
        border: "rgba(139,32,32,0.2)",
      };
    if (c === "medium")
      return {
        color: "#8B5A00",
        bg: "rgba(196,135,58,0.10)",
        border: "rgba(196,135,58,0.25)",
      };
    return {
      color: "#2D6A42",
      bg: "rgba(74,124,90,0.08)",
      border: "rgba(74,124,90,0.2)",
    };
  };

  if (loading)
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: "13px",
          color: "#7A8A93",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Loading...
      </div>
    );
  if (!equipment)
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: "13px",
          color: "#7A8A93",
        }}
      >
        Equipment not found.
      </div>
    );

  /* shared inline input style */
  const inlineInput: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    fontSize: "12px",
    color: "#1A1A1A",
    background: "#FAFAF8",
    border: "1px solid #8FBED6",
    borderRadius: "2px",
    outline: "none",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .detail-root {
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .detail-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #EAE7DF; background: #1A3A52;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
          white-space: nowrap;
        }
        .detail-btn-primary:hover { background: #1F4460; }
        .detail-btn-primary:active { background: #132D40; }

        .detail-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #1A3A52; background: transparent;
          border: 1px solid #D0CBC0; border-radius: 2px;
          cursor: pointer; transition: all 0.15s ease;
          white-space: nowrap;
        }
        .detail-btn-secondary:hover { border-color: #1A3A52; background: rgba(26,58,82,0.04); }

        .detail-btn-danger {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 20px;
            font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px; font-weight: 600;
            letter-spacing: 0.16em; text-transform: uppercase;
            color: #8B2020; background: transparent;
            border: 1px solid #D0CBC0; border-radius: 2px;
            cursor: pointer; transition: all 0.15s ease;
            white-space: nowrap;
        }
        .detail-btn-danger:hover { border-color: #8B2020; background: rgba(139,32,32,0.04); }

        .detail-filter-select {
          padding: 8px 12px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px; font-weight: 500;
          color: #1A3A52; background: #FAFAF8;
          border: 1px solid #D0CBC0; border-radius: 2px;
          outline: none; cursor: pointer;
          letter-spacing: 0.04em;
          transition: border-color 0.15s ease;
        }
        .detail-filter-select:focus { border-color: #1A3A52; }

        .detail-tbody tr { transition: background 0.12s ease; }
        .detail-tbody tr:hover td { background: #EAF1F6; }

        .detail-inline-row td { background: #EBF4FA; }

        .detail-inline-save {
          padding: 6px 10px; background: #2D6A42; color: #fff;
          border: none; border-radius: 2px; cursor: pointer;
          transition: background 0.15s ease;
        }
        .detail-inline-save:hover { background: #235535; }

        .detail-inline-cancel {
          padding: 6px 10px; background: #8B2020; color: #fff;
          border: none; border-radius: 2px; cursor: pointer;
          transition: background 0.15s ease;
        }
        .detail-inline-cancel:hover { background: #6E1A1A; }

        .detail-action-icon {
            padding: 4px;
            color: #5A6A73;
            cursor: pointer;
            border-radius: 2px;
            transition: all 0.15s ease;
        }
        .detail-action-icon.danger:hover {
            background: rgba(26,58,82,0.1);
            color: #1A3A52;
        }
        .detail-action-icon.danger:hover {
            background: rgba(139,32,32,0.1);
            color: #8B2020;
        }

        .detail-table-wrap::-webkit-scrollbar { height: 4px; }
        .detail-table-wrap::-webkit-scrollbar-track { background: #EAE7DF; }
        .detail-table-wrap::-webkit-scrollbar-thumb { background: #8FBED6; border-radius: 2px; }
      `}</style>

      <div className="detail-root">
        {/* ── Page header ── */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#8FBED6",
                  marginBottom: "8px",
                }}
              >
                KR Steel · Equipment Detail
              </p>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#1A3A52",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {equipment.name}
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#7A8A93",
                  marginTop: "6px",
                  letterSpacing: "0.02em",
                }}
              >
                {equipment.code} &bull; {equipment.location}
              </p>
            </div>

            {/* Equipment Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="detail-btn-secondary"
                onClick={() => setIsEqModalOpen(true)}
              >
                <Edit size={13} /> Edit
              </button>
              <button
                className="detail-btn-danger"
                onClick={handleDeleteEquipment}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            {/* Filter */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "10px 20px",
                background: "#FAFAF8",
                border: "1px solid #D0CBC0",
                borderRadius: "2px",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#1A3A52",
                  margin: 0,
                }}
              >
                Criticality
              </p>
              <div
                style={{ width: "1px", height: "16px", background: "#D0CBC0" }}
              />
              <select
                className="detail-filter-select"
                value={filterCriticality}
                onChange={(e) => setFilterCriticality(e.target.value)}
                style={{
                  border: "none",
                  padding: "0",
                  background: "transparent",
                }}
              >
                <option value="All">All Levels</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Job Actions */}
            <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
              <button className="detail-btn-secondary" onClick={exportJobsPDF}>
                <Download size={13} /> Export PDF
              </button>
              {!isAdding && (
                <button
                  className="detail-btn-primary"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={13} /> New Job
                </button>
              )}
            </div>
          </div>
          <div
            style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }}
          />
        </div>

        {/* ── Jobs table ── */}
        <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0" }}>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1px solid #D0CBC0",
              background: "#1A3A52",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#EAE7DF",
                margin: 0,
              }}
            >
              Job History
            </p>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "rgba(234,231,223,0.45)",
                margin: 0,
              }}
            >
              {filteredJobs.length} records
            </p>
          </div>

          <div className="detail-table-wrap" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ background: "#EAE7DF" }}>
                  {[
                    { label: "Job Code", width: "96px" },
                    { label: "Job Name", width: "200px" },
                    { label: "Type", width: "120px" },
                    { label: "Flag", width: "96px" },
                    { label: "Criticality", width: "112px" },
                    { label: "Frequency", width: "112px" },
                    { label: "Date Done", width: "120px" },
                    { label: "Due Date", width: "140px" },
                    { label: "Hrs Worked", width: "90px" },
                    { label: "Planned Hrs", width: "90px" },
                    { label: "Hrs Left", width: "80px" },
                    { label: "Action", width: "80px" },
                  ].map(({ label, width }) => (
                    <th
                      key={label}
                      style={{
                        padding: "11px 14px",
                        textAlign: "left",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "#1A3A52",
                        whiteSpace: "nowrap",
                        borderBottom: "1px solid #D0CBC0",
                        width,
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="detail-tbody">
                {/* Inline add row */}
                {isAdding && (
                  <tr className="detail-inline-row">
                    <td style={{ padding: "8px 8px" }}>
                      <input
                        name="jobCode"
                        value={newJob.jobCode}
                        onChange={handleInputChange}
                        style={inlineInput}
                        placeholder="Code"
                        autoFocus
                      />
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <input
                        name="jobName"
                        value={newJob.jobName}
                        onChange={handleInputChange}
                        style={inlineInput}
                        placeholder="Job Name"
                      />
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <select
                        name="jobType"
                        value={newJob.jobType}
                        onChange={handleInputChange}
                        style={inlineInput}
                      >
                        <option>Maintenance</option>
                        <option>Inspection</option>
                        <option>Repair</option>
                        <option>Overhaul</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <input
                        name="flag"
                        value={newJob.flag}
                        onChange={handleInputChange}
                        style={inlineInput}
                        placeholder="Flag"
                      />
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <select
                        name="criticality"
                        value={newJob.criticality}
                        onChange={handleInputChange}
                        style={inlineInput}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <select
                        name="frequency"
                        value={newJob.frequency}
                        onChange={handleInputChange}
                        style={inlineInput}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="3-monthly">3-Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="5-yearly">5-Yearly</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <input
                        type="date"
                        name="dateDone"
                        value={newJob.dateDone}
                        onChange={handleInputChange}
                        style={inlineInput}
                      />
                    </td>
                    <td
                      style={{
                        padding: "8px 14px",
                        fontSize: "12px",
                        color: "#5A6A73",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {calculated.dateDue}
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <input
                        type="number"
                        name="hoursWorked"
                        value={newJob.hoursWorked}
                        onChange={handleInputChange}
                        style={{ ...inlineInput, textAlign: "center" }}
                      />
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <input
                        type="number"
                        name="plannedHours"
                        value={newJob.plannedHours}
                        onChange={handleInputChange}
                        style={{ ...inlineInput, textAlign: "center" }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1A3A52",
                        textAlign: "center",
                      }}
                    >
                      {calculated.remainingHours}
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="detail-inline-save"
                          onClick={handleCreateJob}
                        >
                          <Save size={13} />
                        </button>
                        <button
                          className="detail-inline-cancel"
                          onClick={() => setIsAdding(false)}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Existing jobs */}
                {filteredJobs.length > 0
                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    filteredJobs.map((job: any) => {
                      const crit = criticalityStyle(job.criticality);
                      const isOverdue = job.overdueDays > 0;
                      return (
                        <tr key={job.id}>
                          <td
                            style={{
                              padding: "12px 14px",
                              fontWeight: 600,
                              color: "#1A3A52",
                              borderBottom: "1px solid #EAE7DF",
                              letterSpacing: "0.04em",
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {job.jobCode}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#1A1A1A",
                              borderBottom: "1px solid #EAE7DF",
                            }}
                          >
                            {job.jobName}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {job.jobType}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                            }}
                          >
                            {job.flag}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              borderBottom: "1px solid #EAE7DF",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                fontSize: "10px",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                borderRadius: "2px",
                                color: crit.color,
                                background: crit.bg,
                                border: `1px solid ${crit.border}`,
                              }}
                            >
                              {job.criticality}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                              textTransform: "capitalize",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {job.frequency}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {format(new Date(job.dateDone), "dd MMM yyyy")}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              borderBottom: "1px solid #EAE7DF",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: isOverdue ? "#8B2020" : "#5A6A73",
                                }}
                              >
                                {format(new Date(job.dateDue), "dd MMM yyyy")}
                              </span>
                              {isOverdue && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    padding: "2px 6px",
                                    borderRadius: "2px",
                                    color: "#8B2020",
                                    background: "rgba(139,32,32,0.07)",
                                    border: "1px solid rgba(139,32,32,0.2)",
                                  }}
                                >
                                  Overdue
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                              textAlign: "center",
                            }}
                          >
                            {job.hoursWorked}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                              textAlign: "center",
                            }}
                          >
                            {job.plannedHours}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                              textAlign: "center",
                            }}
                          >
                            {job.remainingHours}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              borderBottom: "1px solid #EAE7DF",
                            }}
                          >
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="detail-action-icon"
                                onClick={() => openEditJobModal(job)}
                                title="Edit Job"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="detail-action-icon danger"
                                onClick={() => handleDeleteJob(job.id)}
                                title="Delete Job"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : !isAdding && (
                      <tr>
                        <td
                          colSpan={12}
                          style={{
                            padding: "48px 24px",
                            textAlign: "center",
                            fontSize: "12px",
                            letterSpacing: "0.06em",
                            color: "#7A8A93",
                          }}
                        >
                          No jobs found. Click "New Job" to add a maintenance
                          record.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Equipment Edit Modal */}
      <EquipmentModal
        isOpen={isEqModalOpen}
        onClose={() => setIsEqModalOpen(false)}
        onSubmit={handleUpdateEquipment}
        categoryId={parseInt(categoryId)}
        initialData={equipment}
      />

      {/* Job Edit Modal */}
      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSubmit={handleUpdateJob}
        categoryId={categoryId}
        equipmentList={[equipment]} // Only current equipment
        initialData={editingJob}
      />
    </>
  );
}
