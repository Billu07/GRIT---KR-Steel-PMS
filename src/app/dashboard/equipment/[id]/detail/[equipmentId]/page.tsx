"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Plus, Download, Trash2, Edit, Save, X, Wrench, AlertTriangle, RefreshCw } from "lucide-react";
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

  const { data: rawData, error, isLoading, mutate } = useSWR(categoryId ? `/api/equipment/${categoryId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const [updatingHours, setUpdatingHours] = useState<number | null>(null);

  // Inline Creation State
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    taskId: "",
    taskName: "",
    frequency: "weekly",
    taskDetail: "",
    criticality: "medium",
    lastCompletedDate: "",
    estimatedHours: ""
  });

  // Modals state
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLogMaintenanceModalOpen, setIsLogMaintenanceModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingTask, setEditingTask] = useState<any>(null);

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
        mutate();
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

  const handleUpdateHours = async (taskId: number, newHours: string) => {
    const hours = parseInt(newHours);
    if (isNaN(hours)) return;

    setUpdatingHours(taskId);
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runningHours: hours }),
        });
        if (res.ok) {
            mutate();
        }
    } catch (err) {
        console.error(err);
    } finally {
        setUpdatingHours(null);
    }
  };

  const handleCreateTask = async () => {
    try {
      let nextDueDate = null;
      if (newTask.lastCompletedDate) {
         const completedDate = new Date(newTask.lastCompletedDate);
         nextDueDate = new Date(completedDate);
         switch (newTask.frequency) {
            case 'hourly': nextDueDate.setHours(nextDueDate.getHours() + 1); break;
            case 'daily': nextDueDate.setDate(nextDueDate.getDate() + 1); break;
            case 'weekly': nextDueDate.setDate(nextDueDate.getDate() + 7); break;
            case 'fifteen_days': nextDueDate.setDate(nextDueDate.getDate() + 15); break;
            case 'monthly': nextDueDate.setMonth(nextDueDate.getMonth() + 1); break;
            case 'quarterly': nextDueDate.setMonth(nextDueDate.getMonth() + 3); break;
            case 'semi_annually': nextDueDate.setMonth(nextDueDate.getMonth() + 6); break;
            case 'yearly': nextDueDate.setFullYear(nextDueDate.getFullYear() + 1); break;
         }
      }

      const payload = {
        ...newTask,
        equipmentId,
        nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
        estimatedHours: newTask.estimatedHours ? parseInt(newTask.estimatedHours) : null
      };
      
      const res = await fetch(`/api/equipment/${categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        mutate();
        setIsAdding(false);
        setNewTask({
          taskId: "",
          taskName: "",
          frequency: "weekly",
          taskDetail: "",
          criticality: "medium",
          lastCompletedDate: "",
          estimatedHours: ""
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
          mutate();
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
        mutate(); // Refresh list
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
        mutate(); // Important: Refresh to see updated hours/dates
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

  if (isLoading && !rawData)
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
        Loading details...
      </div>
    );

  if (error) return <div className="p-8 text-red-500 font-bold uppercase text-xs tracking-widest">Error loading equipment details.</div>;

  const equipment = rawData?.equipment.find((e: any) => e.id.toString() === equipmentId);
  const tasks = rawData?.tasks.filter((t: any) => t.equipmentId.toString() === equipmentId) || [];

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

  const exportTasksPDF = () => {
    exportEquipmentTasksPdf({ equipment, tasks });
  };

  const exportTasksExcel = () => {
    exportEquipmentTasksExcel({ equipment, tasks });
  };

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

        .row-overdue { background-color: #FEF2F2 !important; }
        .row-overdue:hover td { background-color: #FEE2E2 !important; }
        .text-overdue { color: #DC2626 !important; font-weight: 700 !important; }
        .hours-input { border: 1px solid #D0CBC0; background: #FFF; padding: 2px 4px; width: 60px; border-radius: 2px; font-size: 11px; }
      `}</style>

      <div className="detail-root">
        {/* ── Page header ── */}
        <div style={{ marginBottom: "32px" }}>
          <div
            className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <button 
                  onClick={() => router.push(`/dashboard/equipment/${categoryId}`)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', background: 'transparent', border: '1px solid #D0CBC0',
                    borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontWeight: 600,
                    color: '#7A8A93', textTransform: 'uppercase', letterSpacing: '0.1em'
                  }}
                >
                  ← Back
                </button>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#1684A6",
                    margin: 0,
                  }}
                >
                  KR Steel · Equipment Detail
                </p>
              </div>
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
                Planned Tasks
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
                  fontSize: "11px",
                }}
              >
                <thead>
                  <tr style={{ background: "#EAE7DF" }}>
                    {[
                      { label: "Task ID", width: "80px" },
                      { label: "Task Name", width: "130px" },
                      { label: "Frequency", width: "80px" },
                      { label: "Next Due", width: "90px" },
                      { label: "Est. Hrs", width: "70px" },
                      { label: "Run. Hrs", width: "90px" },
                      { label: "Rem. Hrs", width: "70px" },
                      { label: "Status", width: "80px" },
                      { label: "Actions", width: "80px" },
                    ].map((col) => (
                      <th
                        key={col.label}
                        style={{
                          width: col.width,
                          padding: "10px 16px",
                          textAlign: col.label === "Actions" ? "right" : "left",
                          fontSize: "9px",
                          fontWeight: 600,
                          letterSpacing: "0.14em",
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
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>
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
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>
                        <input
                          type="text"
                          name="taskName"
                          value={newTask.taskName}
                          onChange={handleInputChange}
                          style={inlineInput}
                          placeholder="Name"
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>
                        <select
                          name="frequency"
                          value={newTask.frequency}
                          onChange={handleInputChange}
                          style={{ ...inlineInput, cursor: "pointer" }}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="fifteen_days">15 Days</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi_annually">Semi-Annually</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>
                        <input type="date" name="lastCompletedDate" value={newTask.lastCompletedDate} onChange={handleInputChange} style={inlineInput} />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>
                         <input name="estimatedHours" type="number" value={newTask.estimatedHours} onChange={handleInputChange} style={inlineInput} placeholder="Hrs" />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>0</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>—</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #D0CBC0" }}>—</td>
                      <td
                        style={{
                          padding: "8px 12px",
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

                  {tasks.length > 0 ? (
                    tasks.map((task: any) => {
                      const nextDueDate = task.nextDueDate ? new Date(task.nextDueDate) : null;
                      if (nextDueDate) nextDueDate.setHours(0, 0, 0, 0);
                      const dueSoonDate = new Date(); dueSoonDate.setDate(today.getDate() + 7);
                      
                      let statusText = "UP-TO-DATE";
                      let statusBg = "#DEF7EC";
                      let statusColor = "#03543F";
                      
                      const isOverdue = (nextDueDate && nextDueDate < today) || (task.estimatedHours && task.runningHours >= task.estimatedHours);
                      const isDueSoon = (nextDueDate && nextDueDate >= today && nextDueDate <= dueSoonDate) || (task.estimatedHours && task.runningHours >= task.estimatedHours * 0.9 && task.runningHours < task.estimatedHours);

                      if (isOverdue) {
                          statusText = "OVERDUE";
                          statusBg = "#FDE8E8";
                          statusColor = "#9B1C1C";
                      } else if (isDueSoon) {
                          statusText = "DUE";
                          statusBg = "#FEF3C7";
                          statusColor = "#92400E";
                      }

                      const remainingHours = task.estimatedHours ? task.estimatedHours - task.runningHours : null;

                      return (
                        <tr key={task.id} className={isOverdue ? "row-overdue" : isDueSoon ? "bg-amber-50" : ""}>
                          <td
                            style={{
                              padding: "12px 16px",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                              color: "#225CA3",
                              borderBottom: "1px solid #EAE7DF",
                              letterSpacing: "0.04em",
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isOverdue && <AlertTriangle size={14} className="text-overdue" />}
                                {task.taskId}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              whiteSpace: "nowrap",
                              color: "#1A1A1A",
                              borderBottom: "1px solid #EAE7DF",
                              fontWeight: 500
                            }}
                          >
                            {task.taskName}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
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
                              padding: "12px 16px",
                              whiteSpace: "nowrap",
                              color: "#1A1A1A",
                              borderBottom: "1px solid #EAE7DF",
                            }}
                          >
                            <span className={isOverdue ? "text-overdue" : ""}>
                              {task.nextDueDate ? new Date(task.nextDueDate).toLocaleDateString() : "—"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#5A6A73", borderBottom: "1px solid #EAE7DF" }}>
                            {task.estimatedHours || "—"}
                          </td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid #EAE7DF" }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input 
                                    type="number" 
                                    defaultValue={task.runningHours} 
                                    onBlur={(e) => handleUpdateHours(task.id, e.target.value)}
                                    className="hours-input"
                                    disabled={updatingHours === task.id}
                                />
                                {updatingHours === task.id && <RefreshCw size={10} className="animate-spin text-blue-500" />}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: remainingHours !== null && remainingHours <= 0 ? "#DC2626" : "#5A6A73", fontWeight: remainingHours !== null && remainingHours <= 0 ? 700 : 400, borderBottom: "1px solid #EAE7DF" }}>
                            {remainingHours !== null ? remainingHours : "—"}
                          </td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid #EAE7DF" }}>
                             <span style={{ 
                                padding: "2px 8px", 
                                background: statusBg,
                                color: statusColor,
                                borderRadius: "10px", fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>
                                {statusText}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
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
                        colSpan={9}
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
