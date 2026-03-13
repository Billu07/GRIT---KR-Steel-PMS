"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { X, Calendar, ClipboardCheck, AlertCircle, Package, Search, ChevronDown, ChevronUp } from "lucide-react";

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
  const { data: rawData } = useSWR(isOpen && (!initialEqId || initialData) ? "/api/reports" : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const allEquipment = rawData?.equipment || [];
  const allTasks = rawData?.tasks || [];

  const [formData, setFormData] = useState({
    type: "corrective",
    taskId: "",
    frequency: "",
    equipmentId: "", // used for single select fallback / edit
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

  // Multi-select equipment state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [showEquipmentFilter, setShowEquipmentFilter] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState("");

  const categories = useMemo(() => {
    if (!rawData?.equipment) return [];
    const cats = new Map();
    rawData.equipment.forEach((eq: any) => {
      if (eq.category) {
        cats.set(eq.category.id, eq.category);
      }
    });
    return Array.from(cats.values());
  }, [rawData]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedEquipments([]);
    setEquipmentSearch("");
  };

  const filteredEquipmentList = useMemo(() => {
    let list = allEquipment;
    if (selectedCategory !== "all") {
      list = list.filter((eq: any) => String(eq.categoryId) === selectedCategory);
    }
    if (equipmentSearch) {
      const lowerSearch = equipmentSearch.toLowerCase();
      list = list.filter((eq: any) => 
        eq.name.toLowerCase().includes(lowerSearch) || 
        eq.code.toLowerCase().includes(lowerSearch)
      );
    }
    return list;
  }, [allEquipment, selectedCategory, equipmentSearch]);

  const handleEquipmentToggle = (id: string) => {
    setSelectedEquipments((prev) => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSelectAllEquipment = () => {
    const currentIds = filteredEquipmentList.map((eq: any) => String(eq.id));
    const allSelected = currentIds.every((id: string) => selectedEquipments.includes(id));
    
    if (allSelected && currentIds.length > 0) {
      // Deselect all in the current filtered list
      setSelectedEquipments(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      // Select all in the current filtered list
      setSelectedEquipments(prev => {
        const newSelection = new Set([...prev, ...currentIds]);
        return Array.from(newSelection);
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode
        setFormData({
            type: initialData.type || "corrective",
            taskId: initialData.taskId ? String(initialData.taskId) : "",
            frequency: "",
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
            frequency: "",
            type: "corrective",
            problemDescription: "",
            solutionDetails: "",
            usedParts: "",
            remarks: "",
        }));
        setSelectedCategory("all");
        setSelectedEquipments([]);
        setEquipmentSearch("");
      }
    }
  }, [isOpen, initialEqId, initialData]);

  const filteredTasks = useMemo(() => {
    if (initialEqId) return initialTasks;
    if (selectedEquipments.length === 0 && !formData.equipmentId) return [];
    
    const targetEqIds = selectedEquipments.length > 0 ? selectedEquipments : [formData.equipmentId];
    return allTasks.filter((t: any) => targetEqIds.includes(String(t.equipmentId)));
  }, [initialEqId, initialTasks, allTasks, selectedEquipments, formData.equipmentId]);

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
    
    // Validation
    if (!initialEqId && !initialData) {
      if (selectedEquipments.length === 0) {
        alert("Please select at least one equipment.");
        return;
      }
    } else {
      if (!formData.equipmentId) {
        alert("Please select equipment.");
        return;
      }
    }

    let taskIdsToSubmit: number[] = [];
    let maintenanceDetails = formData.solutionDetails;

    if (formData.type === 'scheduled') {
      if (!initialData) {
        if (!formData.frequency) {
          alert("Please select a frequency.");
          return;
        }
        const tasks = filteredTasks.filter((t: any) => t.frequency === formData.frequency);
        taskIdsToSubmit = tasks.map((t: any) => t.id);
        if (taskIdsToSubmit.length === 0) {
          alert("No tasks found for the selected frequency and equipment.");
          return;
        }
        // Auto-fill maintenanceDetails with task names for bulk logging
        // Just take unique names
        const uniqueTaskNames = Array.from(new Set(tasks.map((t: any) => t.taskName)));
        maintenanceDetails = uniqueTaskNames.join("; ");
      } else {
        if (formData.taskId) {
          taskIdsToSubmit = [parseInt(formData.taskId)];
          const task = filteredTasks.find((t: any) => String(t.id) === formData.taskId);
          if (task) maintenanceDetails = task.taskName;
        }
      }
    }

    const payload = { 
      ...formData,
      equipmentId: initialEqId || initialData ? parseInt(formData.equipmentId) : undefined,
      equipmentIds: !initialEqId && !initialData ? selectedEquipments.map(id => parseInt(id)) : undefined,
      taskId: formData.taskId ? parseInt(formData.taskId) : null,
      taskIds: taskIdsToSubmit.length > 0 ? taskIdsToSubmit : undefined,
      maintenanceDetails: maintenanceDetails
    };
    
    if (formData.type === 'corrective') {
      payload.taskId = null;
      payload.taskIds = undefined;
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
    >
      <div
        style={{
          background: "#FFFFFF", width: "100%", maxWidth: "720px", maxHeight: "95vh",
          display: "flex", flexDirection: "column", borderRadius: "4px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", background: "#225CA3", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>{initialData ? "EDIT MAINTENANCE RECORD" : "LOG MAINTENANCE RECORD"}</h2>
            <p style={{ fontSize: "11px", opacity: 0.8, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {initialEqName || (initialData?.equipment?.name) || "Global Maintenance Entry"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#FFFFFF", cursor: "pointer", opacity: 0.7 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "24px", overflowY: "auto", flex: 1, minHeight: "0" }}>
            
            {/* Equipment Selection (Multi-select for global logging, single select for editing) */}
            {(!initialEqId || initialData) && (
              <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {initialData ? (
                  // Single select for Editing
                  <div>
                    <label style={labelStyle}><Package size={12}/> Select Equipment</label>
                    <select name="equipmentId" value={formData.equipmentId} onChange={handleChange} style={selectStyle} required>
                      <option value="">-- Select Asset --</option>
                      {allEquipment.map((eq: any) => (
                        <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  // Multi-select with Category filter for Global Logging
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#F5F3EF", padding: "16px", borderRadius: "4px", border: "1px solid #D0CBC0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Filter by Category</label>
                        <select style={selectStyle} value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                          <option value="all">All Categories</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ position: "relative" }}>
                        <label style={labelStyle}><Package size={12}/> Select Equipment(s)</label>
                        <button 
                          type="button"
                          onClick={() => setShowEquipmentFilter(!showEquipmentFilter)} 
                          style={{
                            ...fieldStyle, 
                            display: "flex", alignItems: "center", justifyContent: "space-between", 
                            background: "#FFFFFF", cursor: "pointer", textAlign: "left"
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedEquipments.length === 0 ? "None Selected" : `${selectedEquipments.length} Equipment Selected`}
                          </span>
                          {showEquipmentFilter ? <ChevronUp size={14} color="#7A8A93" /> : <ChevronDown size={14} color="#7A8A93" />}
                        </button>

                        {showEquipmentFilter && (
                          <div style={{
                            position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px",
                            background: "#FFFFFF", border: "1px solid #D0CBC0", borderRadius: "2px", 
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 50, maxHeight: "250px", 
                            display: "flex", flexDirection: "column"
                          }}>
                            <div style={{ padding: "8px", borderBottom: "1px solid #EAE7DF", display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ position: "relative" }}>
                                <Search size={12} color="#7A8A93" style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)" }} />
                                <input 
                                  type="text" 
                                  placeholder="Search..." 
                                  value={equipmentSearch}
                                  onChange={(e) => setEquipmentSearch(e.target.value)}
                                  style={{ width: "100%", padding: "6px 8px 6px 24px", fontSize: "11px", border: "1px solid #D0CBC0", borderRadius: "2px", outline: "none" }}
                                />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                                <span style={{ fontSize: "10px", fontWeight: 600, color: "#7A8A93" }}>{filteredEquipmentList.length} items</span>
                                <button 
                                  type="button" 
                                  onClick={handleSelectAllEquipment}
                                  style={{ background: "none", border: "none", fontSize: "10px", fontWeight: 700, color: "#225CA3", cursor: "pointer", textTransform: "uppercase" }}
                                >
                                  {filteredEquipmentList.length > 0 && filteredEquipmentList.every((eq: any) => selectedEquipments.includes(String(eq.id))) ? "Deselect All" : "Select All"}
                                </button>
                              </div>
                            </div>
                            <div style={{ overflowY: "auto", padding: "4px" }} className="scroll-custom">
                              {filteredEquipmentList.map((eq: any) => (
                                <div 
                                  key={eq.id} 
                                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", cursor: "pointer", borderRadius: "2px" }}
                                  onClick={() => handleEquipmentToggle(String(eq.id))}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F5F3EF"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={selectedEquipments.includes(String(eq.id))} 
                                    readOnly 
                                    style={{ accentColor: "#225CA3", width: "14px", height: "14px", cursor: "pointer" }} 
                                  />
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "12px", color: "#1A1A1A", fontWeight: 500 }}>{eq.name}</span>
                                    <span style={{ fontSize: "10px", color: "#7A8A93" }}>{eq.code}</span>
                                  </div>
                                </div>
                              ))}
                              {filteredEquipmentList.length === 0 && (
                                <div style={{ padding: "12px", textAlign: "center", fontSize: "11px", color: "#7A8A93" }}>No equipment found.</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
              {!isCorrective && (
                <div>
                  <label style={labelStyle}>
                      <Calendar size={12}/> 
                      {isScheduled ? 'Maintenance Date' : 'Observation Date'}
                  </label>
                  <input type="datetime-local" name="maintenanceDate" value={formData.maintenanceDate} onChange={handleChange} style={fieldStyle} />
                </div>
              )}
            </div>

            {isScheduled && !initialData && (
              <div style={{ marginBottom: "24px", background: "#EBF4FA", padding: "16px", borderRadius: "4px", border: "1px solid #1CA5CE" }}>
                <label style={labelStyle}><ClipboardCheck size={12}/> Select Task Frequency</label>
                <select name="frequency" value={formData.frequency} onChange={handleChange} style={selectStyle} required>
                  <option value="">-- Select Frequency --</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="15-days">15 Days</option>
                  <option value="monthly">Monthly</option>
                  <option value="3-monthly">Quarterly (3 Months)</option>
                  <option value="6-monthly">Semi-Annually (6 Months)</option>
                  <option value="yearly">Yearly</option>
                  <option value="5-yearly">5 Yearly</option>
                </select>
                {formData.frequency && (
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "#225CA3", fontWeight: 500 }}>
                    Found {filteredTasks.filter((t: any) => t.frequency === formData.frequency).length} task(s) for the selected equipment.
                  </div>
                )}
              </div>
            )}

            {isScheduled && initialData && (
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}><ClipboardCheck size={12}/> Scheduled Task</label>
                <select name="taskId" value={formData.taskId} onChange={handleChange} style={selectStyle} disabled>
                  <option value="">-- Select Task --</option>
                  {filteredTasks.map((t: any) => (
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
              {!isScheduled && (
                <>
                  <div>
                    <label style={labelStyle}>
                        {isPredictive ? 'Condition Analysis / Findings' : 'Problem Description'}
                    </label>
                    <textarea name="problemDescription" value={formData.problemDescription} onChange={handleChange} style={{ ...fieldStyle, minHeight: "60px" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>
                        {isPredictive ? 'Recommended Action' : 'Work Performed / Solution'}
                    </label>
                    <textarea name="solutionDetails" value={formData.solutionDetails} onChange={handleChange} style={{ ...fieldStyle, minHeight: "60px" }} />
                  </div>
                </>
              )}
              <div><label style={labelStyle}>Used Parts / Consumables</label><input type="text" name="usedParts" value={formData.usedParts} onChange={handleChange} style={fieldStyle} placeholder="e.g. 2x Filter, Hydraulic Oil 5L" /></div>
              <div><label style={labelStyle}>General Remarks</label><textarea name="remarks" value={formData.remarks} onChange={handleChange} style={{ ...fieldStyle, minHeight: "40px" }} /></div>
            </div>
          </div>

          <div style={{ padding: "16px 24px", background: "#F5F3EF", borderTop: "1px solid #D0CBC0", display: "flex", justifyContent: "flex-end", gap: "12px", flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D0CBC0", background: "transparent", color: "#7A8A93", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>Cancel</button>
            <button type="submit" style={{ padding: "10px 24px", background: "#225CA3", color: "#FFFFFF", border: "none", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase", borderRadius: "2px" }}>Save Log Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogMaintenanceModal;