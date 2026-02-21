"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, CalendarCheck, Edit, Trash2, Tag, HardHat, Save, X } from "lucide-react";
import TaskModal from "@/components/TaskModal";

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Inline creation state
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    taskId: "",
    taskName: "",
    equipmentId: "",
    frequency: "weekly",
    taskDetail: ""
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const fetchTasks = () => {
    setLoading(true);
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setEquipmentList(data.equipment || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInline = async () => {
    if (!newTask.taskId || !newTask.taskName || !newTask.equipmentId) {
      alert("Please fill in ID, Name and select an Equipment.");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (res.ok) {
        setIsAdding(false);
        setNewTask({ taskId: "", taskName: "", equipmentId: "", frequency: "weekly", taskDetail: "" });
        fetchTasks();
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
    if (!confirm("Are you sure you want to delete this scheduled task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
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
        fetchTasks();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save task");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving task");
    }
  };

  const filteredTasks = tasks.filter((t) => {
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

  if (loading)
    return (
      <div style={{ padding: "40px", fontFamily: "inherit", fontSize: "13px", color: "#7A8A93", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Loading Tasks...
      </div>
    );

  return (
    <>
      <style>{`
        .task-root { font-family: 'DM Sans', sans-serif; }
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
      `}</style>

      <div className="task-root">
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4A6A7A", marginBottom: "8px" }}>
            KR Steel · Maintenance Protocols
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.02em", color: "#225CA3", margin: 0, lineHeight: 1 }}>
                Scheduled Tasks
              </h1>
              <p style={{ fontSize: "13px", color: "#7A8A93", marginTop: "6px" }}>
                {filteredTasks.length} maintenance tasks configured
              </p>
            </div>
            {!isAdding && (
                <button className="task-btn task-btn-primary" onClick={() => setIsAdding(true)}>
                    <Plus size={13} /> Add New Task
                </button>
            )}
          </div>
          <div style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }} />
        </div>

        {/* Search */}
        <div style={{ marginBottom: "24px", position: "relative", maxWidth: "400px" }}>
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
        <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", background: "#225CA3", borderBottom: "1px solid #D0CBC0" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#EAE7DF", margin: 0 }}>
              Master Maintenance Schedule
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#EAE7DF" }}>
                  {["Task ID", "Task Name", "Equipment", "Frequency", "Detail", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 24px", textAlign: h === "Actions" ? "right" : "left", fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#225CA3", borderBottom: "1px solid #D0CBC0", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="task-tbody">
                {/* Inline Creation Row */}
                {isAdding && (
                  <tr className="task-inline-row">
                    <td style={{ padding: "12px 16px" }}>
                      <input name="taskId" value={newTask.taskId} onChange={handleInputChange} style={inlineInput} placeholder="ID" autoFocus />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <input name="taskName" value={newTask.taskName} onChange={handleInputChange} style={inlineInput} placeholder="Task Name" />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <select name="equipmentId" value={newTask.equipmentId} onChange={handleInputChange} style={{ ...inlineInput, cursor: 'pointer' }}>
                        <option value="">-- Asset --</option>
                        {equipmentList.map(eq => (
                          <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <select name="frequency" value={newTask.frequency} onChange={handleInputChange} style={{ ...inlineInput, cursor: 'pointer' }}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="semi_annually">Semi-Annually</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <input name="taskDetail" value={newTask.taskDetail} onChange={handleInputChange} style={inlineInput} placeholder="Description" />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button className="task-save-btn" onClick={handleCreateInline} title="Save"><Save size={13}/></button>
                        <button className="task-cancel-btn" onClick={() => setIsAdding(false)} title="Cancel"><X size={13}/></button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredTasks.length > 0 || isAdding ? (
                  filteredTasks.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #EAE7DF" }}>
                      <td style={{ padding: "14px 24px", color: "#225CA3", fontWeight: 700 }}>{t.taskId}</td>
                      <td style={{ padding: "14px 24px", color: "#1A1A1A", fontWeight: 600 }}>{t.taskName}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A1A' }}>{t.equipment?.name}</span>
                            <span style={{ fontSize: '10px', color: '#7A8A93' }}>{t.equipment?.code}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ padding: "2px 8px", background: "#EAF1F6", color: "#225CA3", borderRadius: "10px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                            {t.frequency}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", color: "#5A6A73", maxWidth: "300px" }}>{t.taskDetail || "—"}</td>
                      <td style={{ padding: "14px 24px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button className="task-action-btn" onClick={() => handleOpenEdit(t)} title="Edit Task">
                           <Edit size={14} />
                        </button>
                        <button className="task-action-btn task-action-btn-del" onClick={() => handleDelete(t.id)} title="Delete Task">
                           <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: "60px 24px", textAlign: "center", color: "#7A8A93" }}>
                      No scheduled tasks found.
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
    </>
  );
}
