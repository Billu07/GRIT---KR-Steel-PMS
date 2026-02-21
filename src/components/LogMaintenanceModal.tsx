"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar, ClipboardCheck, AlertCircle, Package } from "lucide-react";

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  equipmentId?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks?: any[];
  equipmentName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const LogMaintenanceModal: React.FC<LogMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipmentId: initialEqId,
  tasks: initialTasks = [],
  equipmentName: initialEqName = "",
  initialData,
}) => {
  const [formData, setFormData] = useState({
    type: "corrective",
    taskId: "",
    equipmentId: "",
    informationDate: "",
    serviceStartDate: "",
    serviceEndDate: "",
    maintenanceDate: "",
    problemDescription: "",
    solutionDetails: "",
    usedParts: "",
    workType: "new",
    problemType: "minor",
    remarks: "",
  });

  // For global mode: fetch all equipment and tasks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allEquipment, setAllEquipment] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode
        setFormData({
            type: initialData.type || "corrective",
            taskId: initialData.taskId ? String(initialData.taskId) : "",
            equipmentId: initialData.equipmentId ? String(initialData.equipmentId) : "",
            informationDate: initialData.informationDate ? new Date(initialData.informationDate).toISOString().slice(0, 16) : "",
            serviceStartDate: initialData.serviceStartDate ? new Date(initialData.serviceStartDate).toISOString().slice(0, 16) : "",
            serviceEndDate: initialData.serviceEndDate ? new Date(initialData.serviceEndDate).toISOString().slice(0, 16) : "",
            maintenanceDate: initialData.maintenanceDate ? new Date(initialData.maintenanceDate).toISOString().slice(0, 16) : "",
            problemDescription: initialData.problemDescription || "",
            solutionDetails: initialData.solutionDetails || "",
            usedParts: initialData.usedParts || "",
            workType: initialData.workType || "new",
            problemType: initialData.problemType || "minor",
            remarks: initialData.remarks || "",
        });
      } else {
        // Create mode
        const now = new Date().toISOString().slice(0, 16);
        setFormData(prev => ({
            ...prev,
            equipmentId: initialEqId ? String(initialEqId) : "",
            informationDate: now,
            maintenanceDate: now,
            serviceStartDate: now,
            serviceEndDate: now,
            taskId: "",
            type: "corrective",
            problemDescription: "",
            solutionDetails: "",
            usedParts: "",
            remarks: "",
        }));
      }

      // If in global mode (no initialEqId) OR editing, fetch everything to allow changing equipment if needed
      // Actually, if editing, we might want to fetch everything too to show the correct equipment name in dropdown
      if (!initialEqId || initialData) {
        fetch("/api/reports")
          .then(res => res.json())
          .then(data => {
            setAllEquipment(data.equipment || []);
            setAllTasks(data.tasks || []);
          })
          .catch(console.error);
      }
    }
  }, [isOpen, initialEqId, initialData]);

  const filteredTasks = useMemo(() => {
    if (initialEqId) return initialTasks;
    if (!formData.equipmentId) return [];
    return allTasks.filter(t => String(t.equipmentId) === formData.equipmentId);
  }, [initialEqId, initialTasks, allTasks, formData.equipmentId]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipmentId) {
      alert("Please select equipment.");
      return;
    }

    const payload = { 
      ...formData,
      equipmentId: parseInt(formData.equipmentId),
      taskId: formData.taskId ? parseInt(formData.taskId) : null
    };
    
    if (formData.type === 'corrective') {
      payload.taskId = null;
    }

    onSubmit(payload);
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
    color: "#1A1A1A", background: "#FAFAF8", border: "1px solid #D0CBC0", borderRadius: "2px", outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...fieldStyle, appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A8A93' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase", color: "#225CA3", marginBottom: "7px",
  };

  const isScheduled = formData.type === 'scheduled';
  const isPredictive = formData.type === 'predictive';
  const isCorrective = formData.type === 'corrective';

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(12, 22, 33, 0.7)", backdropFilter: "blur(4px)", padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF", width: "100%", maxWidth: "720px", maxHeight: "95vh",
          display: "flex", flexDirection: "column", borderRadius: "4px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", background: "#225CA3", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>{initialData ? "EDIT MAINTENANCE RECORD" : "LOG MAINTENANCE RECORD"}</h2>
            <p style={{ fontSize: "11px", opacity: 0.8, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {initialEqName || (initialData?.equipment?.name) || "Global Maintenance Entry"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#FFFFFF", cursor: "pointer", opacity: 0.7 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
            
            {/* Equipment Selection (Only if not provided or editing) */}
            {(!initialEqId || initialData) && (
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}><Package size={12}/> Select Equipment</label>
                <select name="equipmentId" value={formData.equipmentId} onChange={handleChange} style={selectStyle} required>
                  <option value="">-- Select Asset --</option>
                  {allEquipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}><AlertCircle size={12}/> Log Type</label>
                <select name="type" value={formData.type} onChange={handleChange} style={selectStyle}>
                  <option value="corrective">Corrective (Breakdown)</option>
                  <option value="scheduled">Scheduled (Preventive)</option>
                  <option value="predictive">Predictive (Condition)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                    <Calendar size={12}/> 
                    {isScheduled ? 'Maintenance Date' : isPredictive ? 'Observation Date' : 'Breakdown Reported'}
                </label>
                <input type="datetime-local" name={isScheduled || isPredictive ? "maintenanceDate" : "informationDate"} value={isScheduled || isPredictive ? formData.maintenanceDate : formData.informationDate} onChange={handleChange} style={fieldStyle} />
              </div>
            </div>

            {isScheduled && (
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}><ClipboardCheck size={12}/> Select Scheduled Task</label>
                <select name="taskId" value={formData.taskId} onChange={handleChange} style={selectStyle} required>
                  <option value="">-- Select Task --</option>
                  {filteredTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.taskId}: {t.taskName} ({t.frequency})</option>
                  ))}
                </select>
              </div>
            )}

            {isCorrective && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div><label style={labelStyle}>Service Start</label><input type="datetime-local" name="serviceStartDate" value={formData.serviceStartDate} onChange={handleChange} style={fieldStyle} /></div>
                <div><label style={labelStyle}>Service End</label><input type="datetime-local" name="serviceEndDate" value={formData.serviceEndDate} onChange={handleChange} style={fieldStyle} /></div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>Problem Type</label>
                <select name="problemType" value={formData.problemType} onChange={handleChange} style={selectStyle}>
                  <option value="minor">Minor Issue</option>
                  <option value="major">Major / Critical</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Work Type</label>
                <select name="workType" value={formData.workType} onChange={handleChange} style={selectStyle}>
                  <option value="new">New Job</option>
                  <option value="rework">Rework / Follow-up</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>
                    {isScheduled ? 'Observations & Details' : isPredictive ? 'Condition Analysis / Findings' : 'Problem Description'}
                </label>
                <textarea name="problemDescription" value={formData.problemDescription} onChange={handleChange} style={{ ...fieldStyle, minHeight: "60px" }} />
              </div>
              <div>
                <label style={labelStyle}>
                    {isPredictive ? 'Recommended Action' : 'Work Performed / Solution'}
                </label>
                <textarea name="solutionDetails" value={formData.solutionDetails} onChange={handleChange} style={{ ...fieldStyle, minHeight: "60px" }} />
              </div>
              <div><label style={labelStyle}>Used Parts / Consumables</label><input type="text" name="usedParts" value={formData.usedParts} onChange={handleChange} style={fieldStyle} placeholder="e.g. 2x Filter, Hydraulic Oil 5L" /></div>
              <div><label style={labelStyle}>General Remarks</label><textarea name="remarks" value={formData.remarks} onChange={handleChange} style={{ ...fieldStyle, minHeight: "40px" }} /></div>
            </div>
          </div>

          <div style={{ padding: "16px 24px", background: "#F5F3EF", borderTop: "1px solid #D0CBC0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D0CBC0", background: "transparent", color: "#7A8A93", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>Cancel</button>
            <button type="submit" style={{ padding: "10px 24px", background: "#225CA3", color: "#FFFFFF", border: "none", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase", borderRadius: "2px" }}>Save Log Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogMaintenanceModal;
