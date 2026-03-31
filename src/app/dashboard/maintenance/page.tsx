"use client";

import React, { useState } from "react";
import { Search, Filter, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { format } from "date-fns";
import LogMaintenanceModal from "@/components/LogMaintenanceModal";

export default function MaintenanceLogPage() {
  const { data: rawData, error, isLoading, mutate } = useSWR("/api/maintenance", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState<number | 'bulk' | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterEq, setFilterEq] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterFrequency, setFilterFrequency] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
        mutate();
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
    setIsDeleting(id);
    try {
        const res = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
        if (res.ok) {
            mutate();
            setSelectedIds(prev => prev.filter(sid => sid !== id));
        } else {
            alert("Failed to delete log");
        }
    } catch (err) {
        console.error(err);
        alert("Error deleting log");
    } finally {
        setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected records?`)) return;
    
    setIsDeleting('bulk');
    
    try {
        const res = await fetch(`/api/maintenance`, { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedIds })
        });
        
        if (res.ok) {
            const data = await res.json();
            alert(`Successfully deleted ${data.count} records.`);
            setSelectedIds([]);
            mutate();
        } else {
            alert("Failed to delete records.");
        }
    } catch (err) {
        console.error(err);
        alert("Error during bulk deletion");
    } finally {
        setIsDeleting(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedLogs.length && paginatedLogs.length > 0) {
        setSelectedIds([]);
    } else {
        setSelectedIds(paginatedLogs.map((l: any) => l.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setIsLogModalOpen(true);
  };

  if (isLoading && !rawData)
    return (
      <div style={{ padding: "40px", fontFamily: "inherit", fontSize: "13px", color: "#7A8A93", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Loading Logs...
      </div>
    );

  if (error) return <div className="p-8 text-red-500 font-bold uppercase text-xs tracking-widest">Error loading maintenance logs.</div>;

  const logs = rawData?.logs || [];
  const equipmentList = rawData?.equipment || [];
  const categories = rawData?.categories || [];

  const filteredLogs = logs.filter((log: any) => {
    let match = true;
    if (filterType !== "all" && log.type !== filterType) match = false;
    if (filterEq !== "all" && log.equipmentId.toString() !== filterEq) match = false;
    if (filterCat !== "all" && log.equipment?.categoryId.toString() !== filterCat) match = false;
    if (filterFrequency !== "all" && log.task?.frequency !== filterFrequency) match = false;
    return match;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        
        .ml-table-wrap::-webkit-scrollbar { height: 8px; width: 8px; }
        .ml-table-wrap::-webkit-scrollbar-track { background: #EAE7DF; }
        .ml-table-wrap::-webkit-scrollbar-thumb { background: #1CA5CE; border-radius: 4px; }

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

        .ml-bulk-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #FFFFFF; background: #8B2020;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
          white-space: nowrap;
          margin-right: 12px;
        }
        .ml-bulk-btn:hover { background: #A72828; }
        .ml-bulk-btn:disabled { background: #D0CBC0; cursor: not-allowed; opacity: 0.7; }
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
            <div className="flex items-center">
                {selectedIds.length > 0 && (
                    <button
                        className="ml-bulk-btn"
                        onClick={handleBulkDelete}
                        disabled={isDeleting !== null}
                    >
                        <Trash2 size={13} />
                        {isDeleting === 'bulk' ? `Deleting ${selectedIds.length}...` : `Delete Selected (${selectedIds.length})`}
                    </button>
                )}
                <button
                className="ml-add-btn"
                onClick={() => {
                    setEditingLog(null);
                    setIsLogModalOpen(true);
                }}
                >
                <Plus size={13} />
                Add Log
                </button>
            </div>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
            <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="scheduled">Scheduled</option>
                <option value="predictive">Predictive</option>
                <option value="corrective">Corrective</option>
            </select>

            <select style={selectStyle} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            <select style={selectStyle} value={filterEq} onChange={e => setFilterEq(e.target.value)}>
                <option value="all">All Equipment</option>
                {equipmentList.filter((e: any) => filterCat === "all" || e.categoryId.toString() === filterCat).map((e: any) => (
                <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
            </select>

            <select style={selectStyle} value={filterFrequency} onChange={e => setFilterFrequency(e.target.value)}>
                <option value="all">All Frequencies</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annually">Semi-Annually</option>
                <option value="yearly">Yearly</option>
                <option value="five_yearly">Five Yearly</option>
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

          <div className="ml-table-wrap" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 300px)" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#EAE7DF" }}>
                <tr>
                  <th style={{ padding: "11px 16px", borderBottom: "1px solid #D0CBC0", width: "40px" }}>
                    <input 
                        type="checkbox" 
                        checked={paginatedLogs.length > 0 && selectedIds.length === paginatedLogs.length}
                        onChange={toggleSelectAll}
                        style={{ accentColor: "#225CA3", cursor: "pointer" }}
                    />
                  </th>
                  {[
                    "Timeline / Dates",
                    "Type",
                    "Equipment",
                    "Task Info",
                    "Observations",
                    "Work Done",
                    "Parts",
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
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log: any) => {
                    const isRowDeleting = isDeleting === log.id;
                    return (
                      <tr key={log.id} style={{ opacity: isRowDeleting ? 0.5 : 1 }}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #EAE7DF", textAlign: "center" }}>
                           <input 
                                type="checkbox" 
                                checked={selectedIds.includes(log.id)}
                                onChange={() => toggleSelect(log.id)}
                                style={{ accentColor: "#225CA3", cursor: "pointer" }}
                                disabled={isRowDeleting}
                            />
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            whiteSpace: "nowrap",
                            color: "#1A1A1A",
                            borderBottom: "1px solid #EAE7DF",
                            fontSize: "11px",
                            fontWeight: 500,
                            minWidth: "120px"
                          }}
                        >
                          {log.type === 'corrective' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1A1A1A' }}>
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
                            fontSize: "9px",
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
                              <span style={{ fontSize: '12px' }}>{log.equipment?.name || "—"}</span>
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
                                  <span style={{ color: '#5A6A73', fontSize: '10px' }}>
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
                            fontSize: "11px",
                            lineHeight: "1.4"
                          }}
                        >
                          {log.type === 'scheduled' ? '—' : (log.problemDescription || log.maintenanceDetails || '—')}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "#1A1A1A",
                            borderBottom: "1px solid #EAE7DF",
                            maxWidth: "180px",
                            fontSize: "11px",
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
                        <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid #EAE7DF" }}>
                          <button 
                            onClick={() => handleEdit(log)} 
                            disabled={isRowDeleting}
                            style={{ background: "transparent", border: "none", padding: "4px", cursor: isRowDeleting ? "not-allowed" : "pointer", color: "#7A8A93", transition: "color 0.15s ease" }} 
                            title="Edit Log"
                          >
                             <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(log.id)} 
                            disabled={isRowDeleting}
                            style={{ background: "transparent", border: "none", padding: "4px", cursor: isRowDeleting ? "not-allowed" : "pointer", color: isRowDeleting ? "#D0CBC0" : "#7A8A93", transition: "color 0.15s ease", marginLeft: "4px" }} 
                            title="Delete Log"
                          >
                             {isRowDeleting ? <span style={{ fontSize: '10px', fontWeight: 700 }}>...</span> : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={10}
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
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#D0CBC0] bg-[#F5F3EF]">
              <span className="text-[11px] font-medium text-[#7A8A93]">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 border border-[#D0CBC0] rounded-[2px] bg-white text-[11px] font-bold text-[#225CA3] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAE7DF] transition-colors"
                >
                  PREV
                </button>
                <span className="text-[11px] font-bold text-[#1A1A1A] px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 border border-[#D0CBC0] rounded-[2px] bg-white text-[11px] font-bold text-[#225CA3] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAE7DF] transition-colors"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
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
