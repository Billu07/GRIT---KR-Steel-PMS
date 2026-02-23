"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Search, Plus, CalendarCheck, Edit, Trash2, Tag, HardHat, Save, X, AlertTriangle, RefreshCw, Wrench } from "lucide-react";
import TaskModal from "@/components/TaskModal";
import LogMaintenanceModal from "@/components/LogMaintenanceModal";

export default function PlannedTasksPage() {
  const { data: rawData, error, isLoading, mutate } = useSWR("/api/tasks", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const [search, setSearch] = useState("");
  const [updatingHours, setUpdatingHours] = useState<number | null>(null);

  // Inline creation state
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    taskId: "",
    taskName: "",
    equipmentId: "",
    frequency: "weekly",
    taskDetail: "",
    criticality: "medium",
    lastCompletedDate: "",
    estimatedHours: ""
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Log Maintenance Modal state
  const [isLogMaintenanceOpen, setIsLogMaintenanceOpen] = useState(false);
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<any>(null);

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenLogMaintenance = (task: any) => {
    setSelectedTaskForLog(task);
    setIsLogMaintenanceOpen(true);
  };

  const handleLogMaintenanceSubmit = async (maintenanceData: any) => {
    try {
      const payload = {
        ...maintenanceData,
        equipmentId: selectedTaskForLog.equipmentId,
        taskId: selectedTaskForLog.id,
        type: "scheduled"
      };
      
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setIsLogMaintenanceOpen(false);
        setSelectedTaskForLog(null);
        mutate();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to log maintenance.");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging maintenance.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
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

  const handleCreateInline = async () => {
    if (!newTask.taskId || !newTask.taskName || !newTask.equipmentId) {
      alert("Please fill in ID, Name and select an Equipment.");
      return;
    }

    try {
      // Calculate next due date if last completed date is provided
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
          nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
          estimatedHours: newTask.estimatedHours ? parseInt(newTask.estimatedHours) : null
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAdding(false);
        setNewTask({ taskId: "", taskName: "", equipmentId: "", frequency: "weekly", taskDetail: "", criticality: "medium", lastCompletedDate: "", estimatedHours: "" });
        mutate();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create task");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating task");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this planned task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) mutate();
      else alert("Failed to delete task");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModal = async (taskData: any) => {
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        mutate();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save task");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving task");
    }
  };

  if (isLoading && !rawData)
    return (
      <div style={{ padding: "40px", fontFamily: "inherit", fontSize: "13px", color: "#7A8A93", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Loading Tasks...
      </div>
    );

  if (error) return <div className="p-8 text-red-500 font-bold uppercase text-xs tracking-widest">Error loading planned tasks.</div>;

  const tasks = rawData?.tasks || [];
  const equipmentList = rawData?.equipment || [];

  const filteredTasks = tasks.filter((t: any) => {
    const matchesSearch =
      t.taskName.toLowerCase().includes(search.toLowerCase()) ||
      t.taskId.toLowerCase().includes(search.toLowerCase()) ||
      t.equipment?.name.toLowerCase().includes(search.toLowerCase()) ||
      t.equipment?.code.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const inlineInput: React.CSSProperties = {
    width: "100%", padding: "6px 8px", fontSize: "12px", color: "#1A1A1A",
    background: "#FFFFFF", border: "1px solid #1CA5CE", borderRadius: "2px", outline: "none"
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <style>{`
        .task-root { font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; height: calc(100vh - 40px); }
        .task-search:focus { border-color: #225CA3 !important; box-shadow: 0 0 0 3px rgba(34,92,163,0.07) !important; outline: none; }
        .task-tbody tr { transition: background 0.12s ease; }
        .task-tbody tr:hover td { background: #EAF1F6; }
        .task-inline-row td { background: #EBF4FA !important; border-bottom: 1px solid #1CA5CE !important; }
        .task-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; border-radius: 2px; cursor: pointer; transition: all 0.15s ease; border: none; }
        .task-btn-primary { color: #EAE7DF; background: #225CA3; }
        .task-btn-primary:hover { background: #1B4A82; }
        .task-action-btn { background: transparent; border: none; padding: 4px; cursor: pointer; color: #7A8A93; transition: color 0.15s ease; }
        .task-action-btn:hover { color: #225CA3; }
        .task-action-btn-del:hover { color: #8B2020; }
        .task-save-btn { padding: 6px; background: #2D6A42; color: #fff; border: none; border-radius: 2px; cursor: pointer; }
        .task-cancel-btn { padding: 6px; background: #8B2020; color: #fff; border: none; border-radius: 2px; cursor: pointer; }
        .row-overdue { background-color: #FEF2F2 !important; }
        .row-overdue:hover td { background-color: #FEE2E2 !important; }
        .text-overdue { color: #DC2626 !important; font-weight: 700 !important; }
        .hours-input { border: 1px solid #D0CBC0; background: #FFF; padding: 2px 4px; width: 60px; border-radius: 2px; font-size: 12px; }
        .hours-input:focus { border-color: #225CA3; outline: none; }
        .table-container { flex: 1; overflow: hidden; display: flex; flex-direction: column; background: #FAFAF8; border: 1px solid #D0CBC0; border-radius: 2px; }
        .table-scroll-area { flex: 1; overflow-y: auto; overflow-x: auto; }
        .table-scroll-area::-webkit-scrollbar { width: 8px; height: 8px; }
        .table-scroll-area::-webkit-scrollbar-track { background: #EAE7DF; }
        .table-scroll-area::-webkit-scrollbar-thumb { background: #1CA5CE; border-radius: 4px; }
      `}</style>

      <div className="task-root" style={{ padding: "20px 32px" }}>
        {/* Header */}
        <div style={{ marginBottom: "20px", flexShrink: 0 }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4A6A7A", marginBottom: "8px" }}>
            KR Steel · Maintenance Protocols
          </p>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.02em", color: "#225CA3", margin: 0, lineHeight: 1 }}>
                Planned Tasks
              </h1>
              <p style={{ fontSize: "13px", color: "#7A8A93", marginTop: "6px" }}>
                {filteredTasks.length} maintenance tasks configured
              </p>
            </div>
            {!isAdding && (
                <button className="task-btn task-btn-primary self-start" onClick={() => setIsAdding(true)}>
                    <Plus size={13} /> Add New Task
                </button>
            )}
          </div>
          <div style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }} />
        </div>

        {/* Search */}
        <div style={{ marginBottom: "20px", position: "relative", maxWidth: "400px", flexShrink: 0 }}>
          <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#7A8A93", pointerEvents: "none" }} />
          <input
            type="text"
            className="task-search"
            placeholder="Search tasks or equipment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 38px", fontSize: "13px", color: "#1A1A1A", background: "#FAFAF8", border: "1px solid #D0CBC0", borderRadius: "2px" }}
          />
        </div>

        {/* Table */}
        <div className="table-container">
          <div style={{ padding: "14px 24px", background: "#225CA3", borderBottom: "1px solid #D0CBC0", flexShrink: 0 }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#EAE7DF", margin: 0 }}>
              Master Maintenance Schedule
            </p>
          </div>
          <div className="table-scroll-area">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#EAE7DF" }}>
                <tr>
                  {["Task ID", "Task Name", "Equipment", "Frequency", "Next Due Date", "Est. Hours", "Running Hours", "Rem. Hours", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: h === "Actions" ? "right" : "left", fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#225CA3", borderBottom: "1px solid #D0CBC0", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="task-tbody">
                {/* Inline Creation Row */}
                {isAdding && (
                  <tr className="task-inline-row">
                    <td style={{ padding: "8px 12px" }}>
                      <input name="taskId" value={newTask.taskId} onChange={handleInputChange} style={inlineInput} placeholder="ID" autoFocus />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <input name="taskName" value={newTask.taskName} onChange={handleInputChange} style={inlineInput} placeholder="Task Name" />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <select name="equipmentId" value={newTask.equipmentId} onChange={handleInputChange} style={{ ...inlineInput, cursor: 'pointer' }}>
                        <option value="">-- Asset --</option>
                        {equipmentList.map((eq: any) => (
                          <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <select name="frequency" value={newTask.frequency} onChange={handleInputChange} style={{ ...inlineInput, cursor: 'pointer' }}>
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
                    <td style={{ padding: "8px 12px" }}>
                      <input type="date" name="lastCompletedDate" value={newTask.lastCompletedDate} onChange={handleInputChange} style={inlineInput} />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                        <input name="estimatedHours" type="number" value={newTask.estimatedHours} onChange={handleInputChange} style={inlineInput} placeholder="Hrs" />
                    </td>
                    <td style={{ padding: "8px 12px" }}>0</td>
                    <td style={{ padding: "8px 12px" }}>—</td>
                    <td style={{ padding: "8px 12px" }}>—</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button className="task-save-btn" onClick={handleCreateInline} title="Save"><Save size={13}/></button>
                        <button className="task-cancel-btn" onClick={() => setIsAdding(false)} title="Cancel"><X size={13}/></button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredTasks.length > 0 || isAdding ? (
                  filteredTasks.map((t: any) => {
                    const nextDueDate = t.nextDueDate ? new Date(t.nextDueDate) : null;
                    if (nextDueDate) nextDueDate.setHours(0, 0, 0, 0);
                    const dueSoonDate = new Date(); dueSoonDate.setDate(today.getDate() + 7);
                    
                    let statusText = "UP-TO-DATE";
                    let statusBg = "#DEF7EC";
                    let statusColor = "#03543F";
                    
                    const isOverdue = (nextDueDate && nextDueDate < today) || (t.estimatedHours && t.runningHours >= t.estimatedHours);
                    const isDueSoon = (nextDueDate && nextDueDate >= today && nextDueDate <= dueSoonDate) || (t.estimatedHours && t.runningHours >= t.estimatedHours * 0.9 && t.runningHours < t.estimatedHours);

                    if (isOverdue) {
                        statusText = "OVERDUE";
                        statusBg = "#FDE8E8";
                        statusColor = "#9B1C1C";
                    } else if (isDueSoon) {
                        statusText = "DUE";
                        statusBg = "#FEF3C7";
                        statusColor = "#92400E";
                    }

                    const remainingHours = t.estimatedHours ? t.estimatedHours - t.runningHours : null;

                    return (
                      <tr key={t.id} className={isOverdue ? "row-overdue" : isDueSoon ? "bg-amber-50" : ""} style={{ borderBottom: "1px solid #EAE7DF" }}>
                        <td style={{ padding: "14px 16px", color: "#225CA3", fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isOverdue && <AlertTriangle size={14} className="text-overdue" />}
                            {t.taskId}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#1A1A1A", fontWeight: 600 }}>{t.taskName}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', fontWeight: 500, color: '#1A1A1A' }}>{t.equipment?.name}</span>
                              <span style={{ fontSize: '10px', color: '#7A8A93' }}>{t.equipment?.code}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "2px 6px", background: "#EAF1F6", color: "#225CA3", borderRadius: "10px", fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>
                              {t.frequency}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#1A1A1A" }}>
                          <span className={isOverdue ? "text-overdue" : ""}>
                            {t.nextDueDate ? new Date(t.nextDueDate).toLocaleDateString() : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#5A6A73" }}>
                            {t.estimatedHours || "—"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input 
                                    type="number" 
                                    defaultValue={t.runningHours} 
                                    onBlur={(e) => handleUpdateHours(t.id, e.target.value)}
                                    className="hours-input"
                                    disabled={updatingHours === t.id}
                                />
                                {updatingHours === t.id && <RefreshCw size={10} className="animate-spin text-blue-500" />}
                            </div>
                        </td>
                        <td style={{ padding: "14px 16px", color: remainingHours !== null && remainingHours <= 0 ? "#DC2626" : "#5A6A73", fontWeight: remainingHours !== null && remainingHours <= 0 ? 700 : 400, borderBottom: "1px solid #EAE7DF" }}>
                            {remainingHours !== null ? remainingHours : "—"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                            <span style={{ 
                                padding: "2px 8px", 
                                background: statusBg,
                                color: statusColor,
                                borderRadius: "10px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                                {statusText}
                            </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button className="task-action-btn" onClick={() => handleOpenLogMaintenance(t)} title="Log Maintenance">
                               <Wrench size={14} />
                            </button>
                            <button className="task-action-btn" onClick={() => handleOpenEdit(t)} title="Edit Task">
                               <Edit size={14} />
                            </button>
                            <button className="task-action-btn task-action-btn-del" onClick={() => handleDelete(t.id)} title="Delete Task">
                               <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: "60px 24px", textAlign: "center", color: "#7A8A93" }}>
                      No planned tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        categoryId={null} 
        equipmentList={equipmentList}
        initialData={editingTask}
      />

      {isLogMaintenanceOpen && selectedTaskForLog && (
        <LogMaintenanceModal
          isOpen={isLogMaintenanceOpen}
          onClose={() => {
            setIsLogMaintenanceOpen(false);
            setSelectedTaskForLog(null);
          }}
          onSubmit={handleLogMaintenanceSubmit}
          equipmentId={selectedTaskForLog.equipmentId}
          tasks={[selectedTaskForLog]}
          equipmentName={`${selectedTaskForLog.equipment?.name} (${selectedTaskForLog.equipment?.code})`}
          initialData={{
            type: "scheduled",
            taskId: selectedTaskForLog.id,
            equipmentId: selectedTaskForLog.equipmentId
          }}
        />
      )}
    </>
  );
}
