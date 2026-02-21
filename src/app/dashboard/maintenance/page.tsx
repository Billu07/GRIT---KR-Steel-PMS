"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import LogMaintenanceModal from "@/components/LogMaintenanceModal";

export default function MaintenanceLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterEq, setFilterEq] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/maintenance")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setLogs(data.logs);
          setEquipmentList(data.equipment);
          setCategories(data.categories);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSaveLog = async (data: any) => {
    try {
      let res;
      if (editingLog) {
        res = await fetch(`/api/maintenance/${editingLog.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/maintenance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        setIsLogModalOpen(false);
        setEditingLog(null);
        fetchLogs();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save log");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving log");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this maintenance record?")) return;
    try {
        const res = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
        if (res.ok) fetchLogs();
        else alert("Failed to delete log");
    } catch (err) {
        console.error(err);
        alert("Error deleting log");
    }
  };

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setIsLogModalOpen(true);
  };

  const filteredLogs = logs.filter((log) => {
    let match = true;
    if (filterType !== "all" && log.type !== filterType) match = false;
    if (filterEq !== "all" && log.equipmentId.toString() !== filterEq) match = false;
    if (filterCat !== "all" && log.equipment?.categoryId.toString() !== filterCat) match = false;
    return match;
  });

  const selectStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 500,
    color: "#225CA3",
    background: "#FAFAF8",
    border: "1px solid #D0CBC0",
    borderRadius: "2px",
    outline: "none",
    cursor: "pointer",
    width: "100%"
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .ml-root {
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .ml-tbody tr { transition: background 0.12s ease; }
        .ml-tbody tr:hover td { background: #EAF1F6; }
        
        .ml-table-wrap::-webkit-scrollbar { height: 4px; }
        .ml-table-wrap::-webkit-scrollbar-track { background: #EAE7DF; }
        .ml-table-wrap::-webkit-scrollbar-thumb { background: #1CA5CE; border-radius: 2px; }

        .ml-add-btn {
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
        .ml-add-btn:hover  { background: #1B4A82; }
        .ml-add-btn:active { background: #133660; }
      `}</style>

      <div className="ml-root">
        {/* Page header */}
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#4A6A7A",
              marginBottom: "8px",
            }}
          >
            KR Steel · Ship Recycling Facility
          </p>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
              Maintenance Log
            </h1>
            <button
              className="ml-add-btn self-start"
              onClick={() => {
                setEditingLog(null);
                setIsLogModalOpen(true);
              }}
            >
              <Plus size={13} />
              Add Log
            </button>
          </div>
          <div style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }} />
        </div>

        {/* Filters */}
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:px-6 sm:py-4 bg-[#FAFAF8] border border-[#D0CBC0] rounded-sm mb-6"
        >
          <div className="flex items-center gap-2 shrink-0">
            <Filter size={16} color="#7A8A93" />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A1A" }}>Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="scheduled">Scheduled</option>
                <option value="predictive">Predictive</option>
                <option value="corrective">Corrective</option>
            </select>

            <select style={selectStyle} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            <select style={selectStyle} value={filterEq} onChange={e => setFilterEq(e.target.value)}>
                <option value="all">All Equipment</option>
                {equipmentList.filter(e => filterCat === "all" || e.categoryId.toString() === filterCat).map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0" }}>
          <div
            className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-[#D0CBC0] background-[#225CA3]"
            style={{ background: "#225CA3" }}
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
              Log Records
            </p>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "rgba(234,231,223,0.45)",
                margin: 0,
              }}
            >
              {filteredLogs.length} records
            </p>
          </div>

          <div className="ml-table-wrap" style={{ overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#7A8A93", fontSize: "13px" }}>Loading logs...</div>
            ) : (
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
                      "Timeline / Dates",
                      "Type",
                      "Equipment",
                      "Job Specs",
                      "Observations",
                      "Solution/Work",
                      "Parts",
                      "Remarks",
                      "Actions"
                    ].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "11px 16px",
                          textAlign: col === "Actions" ? "right" : "left",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#225CA3",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid #D0CBC0",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="ml-tbody">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log: any) => {
                      return (
                        <tr key={log.id}>
                          <td
                            style={{
                              padding: "14px 16px",
                              whiteSpace: "nowrap",
                              color: "#1A1A1A",
                              borderBottom: "1px solid #EAE7DF",
                              fontSize: "12px",
                              fontWeight: 500,
                              minWidth: "120px"
                            }}
                          >
                            {log.type === 'corrective' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#7A8A93' }}>REP:</span>
                                        <span style={{ fontSize: '10px' }}>{log.informationDate ? format(new Date(log.informationDate), 'dd MMM yy') : '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#225CA3' }}>SRV:</span>
                                        <span style={{ fontSize: '10px' }}>{log.serviceStartDate ? format(new Date(log.serviceStartDate), 'dd MMM yy') : '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#2D6A42' }}>END:</span>
                                        <span style={{ fontSize: '10px' }}>{log.serviceEndDate ? format(new Date(log.serviceEndDate), 'dd MMM yy') : '—'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#7A8A93' }}>MAINTENANCE DATE:</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>
                                        {log.maintenanceDate ? format(new Date(log.maintenanceDate), 'dd MMM yyyy') : '—'}
                                    </span>
                                </div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              whiteSpace: "nowrap",
                              fontWeight: 700,
                              fontSize: "10px",
                              color: log.type === 'corrective' ? "#8B2020" : "#2D6A42",
                              borderBottom: "1px solid #EAE7DF",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em"
                            }}
                          >
                            {log.type}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              color: "#225CA3",
                              borderBottom: "1px solid #EAE7DF",
                              fontWeight: 600,
                              minWidth: "140px"
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px' }}>{log.equipment?.name || "—"}</span>
                                <span style={{ fontSize: '10px', color: '#4A5568', letterSpacing: '0.02em' }}>{log.equipment?.code}</span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              color: "#1A1A1A",
                              borderBottom: "1px solid #EAE7DF",
                              fontSize: "11px"
                            }}
                          >
                            {log.type === 'corrective' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: '#8B2020', fontWeight: 700 }}>{log.problemType?.toUpperCase()}</span>
                                    <span style={{ color: '#5A6A73' }}>{log.workType?.toUpperCase()} JOB</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: '#2D6A42', fontWeight: 700 }}>{log.task?.taskId || 'PREV'}</span>
                                    <span style={{ color: '#5A6A73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                        {log.task?.taskName || 'MAINTENANCE'}
                                    </span>
                                </div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              color: "#2D3748",
                              borderBottom: "1px solid #EAE7DF",
                              maxWidth: "180px",
                              fontSize: "12px",
                              lineHeight: "1.4"
                            }}
                          >
                            {log.problemDescription || log.maintenanceDetails || '—'}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              color: "#1A1A1A",
                              borderBottom: "1px solid #EAE7DF",
                              maxWidth: "180px",
                              fontSize: "12px",
                              lineHeight: "1.4",
                              fontWeight: 500
                            }}
                          >
                            {log.solutionDetails || '—'}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              color: "#4A5568",
                              borderBottom: "1px solid #EAE7DF",
                              fontSize: "11px"
                            }}
                          >
                            {log.usedParts || "—"}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              color: "#7A8A93",
                              borderBottom: "1px solid #EAE7DF",
                              maxWidth: "120px",
                              fontSize: "11px",
                              fontStyle: "italic"
                            }}
                          >
                            {log.remarks || "—"}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid #EAE7DF" }}>
                            <button onClick={() => handleEdit(log)} style={{ background: "transparent", border: "none", padding: "4px", cursor: "pointer", color: "#7A8A93", transition: "color 0.15s ease" }} title="Edit Log">
                               <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(log.id)} style={{ background: "transparent", border: "none", padding: "4px", cursor: "pointer", color: "#7A8A93", transition: "color 0.15s ease", marginLeft: "4px" }} title="Delete Log">
                               <Trash2 size={14} />
                            </button>
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
                        No maintenance logs found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <LogMaintenanceModal
        isOpen={isLogModalOpen}
        onClose={() => {
            setIsLogModalOpen(false);
            setEditingLog(null);
        }}
        onSubmit={handleSaveLog}
        equipmentId={null} // Passing null allows user to select equipment inside modal
        initialData={editingLog}
      />
    </>
  );
}
