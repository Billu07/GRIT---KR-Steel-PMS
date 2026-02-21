"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Download, Trash2, Edit, Save, X, Wrench } from "lucide-react";
import { exportEquipmentTasksPdf } from "@/lib/pdfExport";
import { exportEquipmentTasksExcel } from "@/lib/excelExport";
import EquipmentModal from "@/components/EquipmentModal";
import TaskModal from "@/components/TaskModal";
import LogMaintenanceModal from "@/components/LogMaintenanceModal";

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const equipmentId = params.equipmentId as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equipment, setEquipment] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline Creation State
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    taskId: "",
    taskName: "",
    frequency: "weekly",
    taskDetail: "",
  });

  // Modals state
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLogMaintenanceModalOpen, setIsLogMaintenanceModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, equipmentId]);

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
            const eqTasks = data.tasks.filter(
              (t: any) => t.equipmentId.toString() === equipmentId,
            );
            setTasks(eqTasks);
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
        "Are you sure you want to delete this equipment? All associated tasks will be deleted.",
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

  // ── TASK ACTIONS ──

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTask = async () => {
    try {
      const payload = {
        ...newTask,
        equipmentId,
      };
      const res = await fetch(`/api/equipment/${categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchData();
        setIsAdding(false);
        setNewTask({
          taskId: "",
          taskName: "",
          frequency: "weekly",
          taskDetail: "",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to create task");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating task");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateTask = async (taskData: any) => {
    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (res.ok) {
          fetchData();
          setIsTaskModalOpen(false);
          setEditingTask(null);
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Failed to update task");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error updating task");
    }
  };

  const handleDeleteTask = async (dbId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${dbId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData(); // Refresh list
      } else {
        alert("Failed to delete task");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting task");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLogMaintenance = async (maintenanceData: any) => {
    try {
      const payload = {
        ...maintenanceData,
        equipmentId: parseInt(equipmentId),
      };
      
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        alert("Maintenance logged successfully!");
        setIsLogMaintenanceModalOpen(false);
      } else {
        alert("Failed to log maintenance.");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging maintenance.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditTaskModal = (task: any) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const exportTasksPDF = () => {
    exportEquipmentTasksPdf({ equipment, tasks });
  };

  const exportTasksExcel = () => {
    exportEquipmentTasksExcel({ equipment, tasks });
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
    border: "1px solid #1CA5CE",
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
          color: #EAE7DF; background: #225CA3;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
          white-space: nowrap;
        }
        .detail-btn-primary:hover { background: #1B4A82; }
        .detail-btn-primary:active { background: #133660; }

        .detail-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #225CA3; background: transparent;
          border: 1px solid #D0CBC0; border-radius: 2px;
          cursor: pointer; transition: all 0.15s ease;
          white-space: nowrap;
        }
        .detail-btn-secondary:hover { border-color: #225CA3; background: rgba(34, 92, 163,0.04); }

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
            background: rgba(139,32,32,0.1);
            color: #8B2020;
        }

        .detail-table-wrap::-webkit-scrollbar { height: 4px; }
        .detail-table-wrap::-webkit-scrollbar-track { background: #EAE7DF; }
        .detail-table-wrap::-webkit-scrollbar-thumb { background: #1CA5CE; border-radius: 2px; }
      `}</style>

      <div className="detail-root">
        {/* ── Page header ── */}
        <div style={{ marginBottom: "32px" }}>
          <div
            className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6"
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#1684A6",
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
                  color: "#225CA3",
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
            <div className="flex flex-wrap gap-2 sm:gap-3">
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
            className="flex flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-4"
          >
            {/* Task Actions */}
            <button className="detail-btn-secondary" onClick={exportTasksPDF}>
            <Download size={13} /> Export PDF
            </button>
            <button className="detail-btn-secondary" onClick={exportTasksExcel}>
            <Download size={13} /> Export Tasks (Excel)
            </button>
            <button
                className="detail-btn-secondary"
                onClick={() => setIsLogMaintenanceModalOpen(true)}
                title="Log un-scheduled, predictive, or corrective maintenance"
            >
                <Wrench size={13} /> Log Maintenance
            </button>
            {!isAdding && (
            <button
                className="detail-btn-primary"
                onClick={() => setIsAdding(true)}
            >
                <Plus size={13} /> New Task
            </button>
            )}
          </div>

          <div
            style={{ height: "1px", background: "#D0CBC0", marginTop: "24px" }}
          />
        </div>

        {/* ── Main container ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Equipment Info Cards */}
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
          >
             {/* Left Column: Specs & Certs */}
             <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
                
                {/* Technical Specs */}
                <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0", padding: "20px 24px" }}>
                   <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#225CA3", marginBottom: "16px", borderBottom: "1px solid #EAE7DF", paddingBottom: "8px" }}>
                      Technical Specifications
                   </p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Capacity</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.capacity || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Brand / Make</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.brand || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Model</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.model || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Serial Number</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.serialNumber || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Running Hours</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.runningHours || "—"}</p>
                      </div>
                   </div>
                </div>

                {/* Certifications */}
                <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0", padding: "20px 24px" }}>
                   <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#225CA3", marginBottom: "16px", borderBottom: "1px solid #EAE7DF", paddingBottom: "8px" }}>
                      Certification & Testing
                   </p>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Test Cert No.</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.testCertNumber || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Validity</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.testCertValidity || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93", textTransform: "uppercase", marginBottom: "4px" }}>Applied</p>
                        <p style={{ fontSize: "13px", color: "#1A1A1A" }}>{equipment.testCertApplied || "—"}</p>
                      </div>
                   </div>
                </div>

             </div>

             {/* Right Column: Status & Description */}
             <div className="lg:col-span-1 flex flex-col gap-4 lg:gap-6">
                
                <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0", padding: "20px 24px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7A8A93", marginBottom: "8px" }}>
                    Status
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: equipment.status === "active" ? "#2D6A42" : "#8B2020", textTransform: "capitalize", margin: 0 }}>
                    {equipment.status}
                  </p>
                </div>

                <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0", padding: "20px 24px", flex: 1 }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7A8A93", marginBottom: "8px" }}>
                    Description
                  </p>
                  <p style={{ fontSize: "13px", color: "#1A1A1A", margin: 0, lineHeight: 1.6 }}>
                    {equipment.description || "—"}
                  </p>
                </div>

                <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0", padding: "20px 24px", flex: 1 }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7A8A93", marginBottom: "8px" }}>
                    Safety Measures
                  </p>
                  <p style={{ fontSize: "13px", color: "#1A1A1A", margin: 0, lineHeight: 1.6 }}>
                    {equipment.safetyMeasures || "—"}
                  </p>
                </div>

             </div>
          </div>

          {/* ── Tasks table ── */}
          <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid #D0CBC0",
                background: "#225CA3",
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
                Scheduled Tasks
              </p>
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  color: "rgba(234,231,223,0.45)",
                  margin: 0,
                }}
              >
                {tasks.length} records
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
                      { label: "Task ID", width: "96px" },
                      { label: "Task Name", width: "200px" },
                      { label: "Frequency", width: "100px" },
                      { label: "Detail", width: "auto" },
                      { label: "Actions", width: "80px" },
                    ].map((col) => (
                      <th
                        key={col.label}
                        style={{
                          width: col.width,
                          padding: "11px 24px",
                          textAlign: col.label === "Actions" ? "right" : "left",
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "#225CA3",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid #D0CBC0",
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="detail-tbody">
                  {/* Inline Creation Row */}
                  {isAdding && (
                    <tr className="detail-inline-row">
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #D0CBC0" }}>
                        <input
                          type="text"
                          name="taskId"
                          value={newTask.taskId}
                          onChange={handleInputChange}
                          style={inlineInput}
                          placeholder="ID"
                          autoFocus
                        />
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #D0CBC0" }}>
                        <input
                          type="text"
                          name="taskName"
                          value={newTask.taskName}
                          onChange={handleInputChange}
                          style={inlineInput}
                          placeholder="Name"
                        />
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #D0CBC0" }}>
                        <select
                          name="frequency"
                          value={newTask.frequency}
                          onChange={handleInputChange}
                          style={{ ...inlineInput, cursor: "pointer" }}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi_annually">Semi-Annually</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #D0CBC0" }}>
                        <input
                          type="text"
                          name="taskDetail"
                          value={newTask.taskDetail}
                          onChange={handleInputChange}
                          style={inlineInput}
                          placeholder="Detail"
                        />
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #D0CBC0",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            className="detail-inline-save"
                            onClick={handleCreateTask}
                            title="Save"
                          >
                            <Save size={13} />
                          </button>
                          <button
                            className="detail-inline-cancel"
                            onClick={() => setIsAdding(false)}
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {tasks.length > 0 || isAdding ? (
                    tasks.map((task: any) => {
                      return (
                        <tr key={task.id}>
                          <td
                            style={{
                              padding: "14px 24px",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                              color: "#225CA3",
                              borderBottom: "1px solid #EAE7DF",
                              letterSpacing: "0.04em",
                              fontSize: "12px",
                            }}
                          >
                            {task.taskId}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              whiteSpace: "nowrap",
                              color: "#1A1A1A",
                              borderBottom: "1px solid #EAE7DF",
                            }}
                          >
                            {task.taskName}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              whiteSpace: "nowrap",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                              textTransform: "capitalize",
                            }}
                          >
                            {task.frequency}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              whiteSpace: "normal",
                              color: "#5A6A73",
                              borderBottom: "1px solid #EAE7DF",
                            }}
                          >
                            {task.taskDetail}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #EAE7DF",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                              <button
                                className="detail-action-icon"
                                onClick={() => openEditTaskModal(task)}
                                title="Edit Task"
                                style={{ background: "transparent", border: "none" }}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="detail-action-icon danger"
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete Task"
                                style={{ background: "transparent", border: "none" }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: "48px 24px",
                          textAlign: "center",
                          fontSize: "12px",
                          letterSpacing: "0.06em",
                          color: "#7A8A93",
                        }}
                      >
                        No tasks configured for this equipment yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <EquipmentModal
        isOpen={isEqModalOpen}
        onClose={() => setIsEqModalOpen(false)}
        onSubmit={handleUpdateEquipment}
        categoryId={parseInt(categoryId)}
        initialData={equipment}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleUpdateTask}
        categoryId={categoryId}
        equipmentList={[equipment]}
        initialData={editingTask}
      />
      
      <LogMaintenanceModal
        isOpen={isLogMaintenanceModalOpen}
        onClose={() => setIsLogMaintenanceModalOpen(false)}
        onSubmit={handleLogMaintenance}
        equipmentId={parseInt(equipmentId)}
        tasks={tasks}
        equipmentName={equipment.name}
      />
    </>
  );
}
