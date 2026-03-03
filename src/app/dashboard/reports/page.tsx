"use client";

import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Download, FileSpreadsheet, FileText, Filter, Calendar, Layers, Search, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { exportTaskReportPdf, exportEquipmentReportPdf, exportMaintenancePdf } from "@/lib/pdfExport";
import { exportMaintenanceExcel, exportTaskReportExcel, exportEquipmentReportExcel, exportToExcel } from "@/lib/excelExport";
import { exportToPDF } from "@/lib/pdfExport";
import { format } from "date-fns";
import { getTaskStatus } from "@/lib/taskUtils";
import { calculateNextDueDate } from "@/lib/dateUtils";

export default function ReportsBuilderPage() {
  const { data: rawData, error, isLoading } = useSWR("/api/reports", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const [loading, setLoading] = useState(false);

  // Configuration State
  const [reportType, setReportType] = useState("tasks");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [groupBy, setGroupBy] = useState("equipment"); // category, equipment, none
  const [statusFilter, setStatusFilter] = useState("all"); // all, overdue, due, healthy

  // Sync GroupBy with Report Type
  useEffect(() => {
    if (reportType === "equipment" && groupBy === "equipment") {
      setGroupBy("category");
    }
  }, [reportType, groupBy]);

  // Maintenance Filters
  const [maintenanceType, setMaintenanceType] = useState("corrective");
  const [durationFilterType, setDurationFilterType] = useState("none");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Category & Equipment Selection
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showEquipmentFilter, setShowEquipmentFilter] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);

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
    if (categoryId === "all") {
      setSelectedEquipments([]);
    } else {
      const eqIds = rawData?.equipment
        .filter((eq: any) => String(eq.categoryId) === categoryId)
        .map((eq: any) => String(eq.id)) || [];
      setSelectedEquipments(eqIds);
    }
  };

  const filteredEquipmentList = useMemo(() => {
    if (!rawData?.equipment) return [];
    if (selectedCategory === "all") return rawData.equipment;
    return rawData.equipment.filter((eq: any) => String(eq.categoryId) === selectedCategory);
  }, [rawData, selectedCategory]);

  // Derived / Filtered Data
  const filteredData = useMemo(() => {
    if (!rawData) return null;
    const { tasks, equipment, maintenanceHistory, inventory } = rawData;
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueSoonDate = new Date();
    dueSoonDate.setDate(today.getDate() + 7);

    if (reportType === "tasks") {
        let filteredTasks = tasks;
        
        // Filter by Equipment
        if (selectedEquipments.length > 0) {
            filteredTasks = filteredTasks.filter((t: any) => selectedEquipments.includes(String(t.equipmentId)));
        }

        // Filter by Status (Overdue logic)
        if (statusFilter !== "all") {
            filteredTasks = filteredTasks.filter((t: any) => {
                const status = getTaskStatus(t);
                
                if (statusFilter === "overdue") return status === "OVERDUE";
                if (statusFilter === "due") return status === "DUE";
                return status === "UP-TO-DATE";
            });
        }

        // Compress / Group Tasks
        const groupedTasksMap = new Map();
        filteredTasks.forEach((t: any) => {
            const key = `${t.equipmentId}-${t.frequency}`;
            if (!groupedTasksMap.has(key)) {
                groupedTasksMap.set(key, { 
                    ...t, 
                    _count: 1, 
                    _allTaskIds: [t.taskId],
                    _allNames: [`1. ${t.taskName}`], 
                    _rawStatuses: [getTaskStatus(t)] 
                });
            } else {
                const group = groupedTasksMap.get(key);
                group._count++;
                if (t.taskId) group._allTaskIds.push(t.taskId);
                group._allNames.push(`${group._count}. ${t.taskName}`);
                group._rawStatuses.push(getTaskStatus(t));
                if (t.nextDueDate && (!group.nextDueDate || new Date(t.nextDueDate) < new Date(group.nextDueDate))) {
                    group.nextDueDate = t.nextDueDate;
                }
                if (t.lastCompletedDate && (!group.lastCompletedDate || new Date(t.lastCompletedDate) > new Date(group.lastCompletedDate))) {
                    group.lastCompletedDate = t.lastCompletedDate;
                }
            }
        });

        const frequencyOrder: { [key: string]: number } = {
            'daily': 1,
            'weekly': 2,
            'monthly': 3,
            'quarterly': 4,
            'semi_annually': 5,
            'yearly': 6,
            'five_yearly': 7
        };

        filteredTasks = Array.from(groupedTasksMap.values()).map((g: any) => ({
            ...g,
            taskId: g._count > 1 ? g._allTaskIds.join(', ') : g.taskId,
            taskName: g._count > 1 ? g._allNames.join('\n') : g.taskName,
            _computedStatus: g._rawStatuses.includes("OVERDUE") ? "OVERDUE" : g._rawStatuses.includes("DUE") ? "DUE" : "UP-TO-DATE"
        }));

        filteredTasks.sort((a: any, b: any) => {
            const freqA = a.frequency?.toLowerCase() || 'yearly';
            const freqB = b.frequency?.toLowerCase() || 'yearly';
            return (frequencyOrder[freqA] || 99) - (frequencyOrder[freqB] || 99);
        });

        return { tasks: filteredTasks, equipment };
    } 
    
    if (reportType === "equipment") {
        let filteredEq = equipment;
        if (selectedEquipments.length > 0) {
            filteredEq = filteredEq.filter((e: any) => selectedEquipments.includes(String(e.id)));
        }
        return { equipment: filteredEq };
    }

    if (reportType === "maintenance") {
      if (!maintenanceHistory) return { maintenance: [] };
      let filtered = maintenanceHistory;

      if (maintenanceType === "corrective") {
        filtered = filtered.filter((m: any) => m.type === "corrective");
      } else {
        filtered = filtered.filter((m: any) => m.type === "scheduled" || m.type === "predictive");
      }

      if (selectedEquipments.length > 0) {
        filtered = filtered.filter((m: any) => selectedEquipments.includes(String(m.equipmentId)));
      }

      // Overdue context for historical logs
      if (statusFilter !== "all") {
          filtered = filtered.filter((m: any) => {
             let wasDateOverdue = false;
             if (m.targetDate && m.maintenanceDate) {
                 const tDate = new Date(m.targetDate);
                 tDate.setHours(0,0,0,0);
                 const mDate = new Date(m.maintenanceDate);
                 mDate.setHours(0,0,0,0);
                 wasDateOverdue = mDate > tDate;
             }
             const wasHoursOverdue = m.targetHours && m.runningHours && m.runningHours >= m.targetHours;
             const wasOverdueAtCompletion = wasDateOverdue || wasHoursOverdue;
             return statusFilter === "overdue" ? wasOverdueAtCompletion : !wasOverdueAtCompletion;
          });
      }

      if (durationFilterType !== "none") {
        filtered = filtered.filter((m: any) => {
          let targetDate = m.performedAt ? new Date(m.performedAt) : null;
          if (m.type === "corrective" && m.serviceEndDate) targetDate = new Date(m.serviceEndDate);
          else if (m.maintenanceDate) targetDate = new Date(m.maintenanceDate);

          if (!targetDate) return false;
          if (durationFilterType === "range" && fromDate && toDate) {
            const fDate = new Date(fromDate);
            const tEnd = new Date(toDate);
            tEnd.setHours(23, 59, 59, 999);
            return targetDate >= fDate && targetDate <= tEnd;
          }
          if (durationFilterType === "date" && singleDate) {
            return targetDate.toISOString().split("T")[0] === singleDate;
          }
          if (durationFilterType === "month" && month) {
            const [y, mStr] = month.split("-");
            return targetDate.getFullYear() === parseInt(y) && targetDate.getMonth() + 1 === parseInt(mStr);
          }
          if (durationFilterType === "year" && year) {
            return targetDate.getFullYear() === parseInt(year);
          }
          return true;
        });
      }

      // Compress / Group Maintenance Logs
      if (maintenanceType !== "corrective") {
          const groupedMaintMap = new Map();
          filtered.forEach((m: any) => {
              const dateStr = m.maintenanceDate ? new Date(m.maintenanceDate).toISOString().split('T')[0] : 'unknown-date';
              const taskFreq = m.task?.frequency ? m.task.frequency.toUpperCase() : 'N/A';
              const key = `${m.equipmentId}-${dateStr}-${taskFreq}`;
              
              if (!groupedMaintMap.has(key)) {
                  groupedMaintMap.set(key, {
                      ...m,
                      _count: 1,
                      _allTasks: [m.task?.taskName || m.maintenanceDetails || 'Unknown Task'],
                      _frequencies: [taskFreq],
                      _isLate: (m.targetDate && m.maintenanceDate && new Date(m.maintenanceDate) > new Date(m.targetDate)) || (m.targetHours && m.runningHours && m.runningHours >= m.targetHours)
                  });
              } else {
                  const group = groupedMaintMap.get(key);
                  group._count++;
                  group._allTasks.push(m.task?.taskName || m.maintenanceDetails || 'Unknown Task');
                  if (taskFreq !== 'N/A' && !group._frequencies.includes(taskFreq)) {
                      group._frequencies.push(taskFreq);
                  }
                  const isLate = (m.targetDate && m.maintenanceDate && new Date(m.maintenanceDate) > new Date(m.targetDate)) || (m.targetHours && m.runningHours && m.runningHours >= m.targetHours);
                  if (isLate) group._isLate = true;
              }
          });

          filtered = Array.from(groupedMaintMap.values()).map((g: any) => {
              const freqList = g._frequencies.filter((f: string) => f !== 'N/A');
              const freqStr = freqList.length > 0 ? freqList.join(', ') : 'N/A';
              
              if (g._count === 1) {
                  let computedNextDue = g.task?.nextDueDate ? new Date(g.task.nextDueDate) : null;
                  if (!computedNextDue && g.maintenanceDate && g.task?.frequency) {
                       computedNextDue = calculateNextDueDate(new Date(g.maintenanceDate), g.task.frequency);
                  }
                  if (computedNextDue) {
                      if (!g.task) g.task = {};
                      g.task.nextDueDate = computedNextDue;
                  }

                  return {
                      ...g,
                      maintenanceDetails: freqStr,
                      _computedLate: g._isLate,
                      _freqStr: freqStr,
                      solutionDetails: g.task?.taskName || g.maintenanceDetails || 'Unknown Task'
                  };
              }

              let groupNextDue = null;
              if (g.maintenanceDate && freqList.length > 0) {
                  groupNextDue = calculateNextDueDate(new Date(g.maintenanceDate), freqList[0].toLowerCase());
              }
              
              return {
                  ...g,
                  maintenanceDetails: freqStr,
                  solutionDetails: g._allTasks.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n'),
                  task: groupNextDue ? { nextDueDate: groupNextDue } : null, // Include nextDueDate for exports
                  _computedLate: g._isLate,
                  _freqStr: freqStr
              };
          });
      }

      // Sort by date before returning
      filtered.sort((a: any, b: any) => {
        const getEffectiveDate = (m: any) => {
            if (maintenanceType === "corrective") {
                return m.serviceEndDate ? new Date(m.serviceEndDate).getTime() : (m.maintenanceDate ? new Date(m.maintenanceDate).getTime() : 0);
            }
            return m.maintenanceDate ? new Date(m.maintenanceDate).getTime() : (m.targetDate ? new Date(m.targetDate).getTime() : 0);
        };
        return getEffectiveDate(a) - getEffectiveDate(b);
      });

      return { maintenance: filtered };
    }

    if (reportType === "inventory") {
      return { inventory: inventory || [] };
    }

    return null;
  }, [rawData, reportType, maintenanceType, durationFilterType, fromDate, toDate, singleDate, month, year, selectedEquipments, statusFilter]);


  const handleDownload = async () => {
    if (!filteredData || !rawData) return;
    setLoading(true);

    try {
      if (reportType === "tasks") {
        const tasks = filteredData.tasks || [];
        if (reportFormat === "pdf") exportTaskReportPdf({ tasks, equipment: rawData.equipment, groupBy });
        else await exportTaskReportExcel({ tasks, equipment: rawData.equipment, groupBy });
      } else if (reportType === "equipment") {
        const equipment = filteredData.equipment || [];
        if (reportFormat === "pdf") exportEquipmentReportPdf({ equipment, groupBy });
        else await exportEquipmentReportExcel({ equipment, groupBy });
      } else if (reportType === "maintenance") {
         const maintenance = filteredData.maintenance || [];
         if (reportFormat === "pdf") {
            exportMaintenancePdf({ data: maintenance, type: maintenanceType as 'corrective' | 'preventive' });
         } else {
            await exportMaintenanceExcel(maintenance, maintenanceType as 'corrective' | 'preventive', `KR_Steel_${maintenanceType}_Maintenance`);
         }
      } else if (reportType === "inventory") {
        const inventory = filteredData.inventory || [];
        if (reportFormat === "pdf") {
          const headers = [["SL No.", "Equipment Name", "Quantity", "Description", "SWL", "Certificate Number"]];
          const data = inventory.map((item: any, idx: number) => [idx + 1, item.name, item.quantity || "-", item.description || "-", item.swl || "-", item.certificateNo || "-"]);
          exportToPDF("Shipyard Inventory Summary", headers, data, "KR_Steel_Inventory_Report");
        } else {
          const data = inventory.map((item: any, idx: number) => ({"SL No.": idx + 1, "Name of Equipment": item.name, "Quantity": item.quantity || "-", "Description": item.description || "-", "SWL": item.swl || "-", "Certificate Number": item.certificateNo || "-"}));
          await exportToExcel(data, "KR_Steel_Inventory_Report");
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentToggle = (id: string) => {
    setSelectedEquipments((prev) => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const selectStyle: React.CSSProperties = {
    padding: "8px 32px 8px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#1A1A1A", background: "#FFFFFF",
    border: "1px solid #D0CBC0", borderRadius: "2px", outline: "none", cursor: "pointer", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A8A93' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", width: "100%"
  };

  const inputStyle: React.CSSProperties = {
    padding: "7px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", border: "1px solid #D0CBC0", borderRadius: "2px", outline: "none", width: "100%"
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] text-[#1A1A1A] font-sans">
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .scroll-custom::-webkit-scrollbar { width: 8px; height: 8px; }
        .scroll-custom::-webkit-scrollbar-track { background: #f1f1f1; }
        .scroll-custom::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
      `}</style>

      <div className="px-4 sm:px-8 py-6 border-b border-[#D0CBC0] bg-white flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        <div>
           <p className="text-[10px] font-semibold tracking-[0.2em] text-[#4A6A7A] uppercase mb-2">KR Steel · Ship Recycling Facility</p>
           <h1 className="text-2xl font-bold text-[#225CA3] tracking-tight">Report Builder</h1>
        </div>
        <button onClick={handleDownload} disabled={loading || isLoading || !filteredData} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#225CA3] text-[#EAE7DF] text-[11px] font-bold tracking-widest uppercase rounded hover:bg-[#1B4A82] active:bg-[#133660] disabled:opacity-50 transition-colors">
           {loading ? "Generating..." : (
               <>
                 {reportFormat === "excel" ? <FileSpreadsheet size={16} /> : <Download size={16} />}
                 <span>Download Report</span>
               </>
           )}
        </button>
      </div>

      <div className="px-4 sm:px-8 py-4 bg-[#F5F3EF] border-b border-[#D0CBC0] flex flex-wrap items-center gap-4 sm:gap-6 shrink-0 z-20">
        <div className="flex flex-col gap-1 w-full sm:w-auto">
           <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Report Type</label>
           <select style={selectStyle} value={reportType} onChange={(e) => setReportType(e.target.value)}>
             <option value="tasks">Scheduled Tasks</option>
             <option value="equipment">Equipment Registry</option>
             <option value="maintenance">Maintenance History</option>
             <option value="inventory">Inventory Summary</option>
           </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Format</label>
        <select style={selectStyle} value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
            <option value="pdf">PDF Document</option>
            <option value="excel">Excel Spreadsheet</option>
        </select>
        </div>

        {reportType !== "inventory" && reportType !== "equipment" && (
             <div className="flex flex-col gap-1 w-full sm:w-auto">
             <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Status Filter</label>
             <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Records</option>
                <option value="overdue">Overdue / Late Only</option>
                <option value="due">Due Soon Only</option>
                <option value="healthy">Up-to-date / Healthy</option>
             </select>
             </div>
        )}

        {reportType !== "maintenance" && reportType !== "inventory" && (
             <div className="flex flex-col gap-1 w-full sm:w-auto">
             <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Group By</label>
             <select style={selectStyle} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="category">Category</option>
                {reportType === "tasks" && <option value="equipment">Equipment</option>}
                <option value="none">No Grouping</option>
             </select>
             </div>
        )}

        {reportType === "maintenance" && (
             <div className="flex flex-col gap-1 w-full sm:w-auto">
             <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Maint. Type</label>
             <select style={selectStyle} value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)}>
                 <option value="corrective">Corrective</option>
                 <option value="preventive">Preventive (Sched/Pred)</option>
             </select>
             </div>
        )}

        {reportType === "maintenance" && (
             <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
             <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Date Filter</label>
             <div className="flex flex-col sm:flex-row items-center gap-2">
                <select style={selectStyle} value={durationFilterType} onChange={(e) => setDurationFilterType(e.target.value)}>
                    <option value="none">All Time</option>
                    <option value="range">Date Range</option>
                    <option value="month">Specific Month</option>
                    <option value="year">Specific Year</option>
                </select>
                {durationFilterType === "range" && (
                    <div className="flex items-center gap-2 w-full">
                        <input type="date" style={inputStyle} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                        <span className="text-[#7A8A93]">-</span>
                        <input type="date" style={inputStyle} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                )}
                {durationFilterType === "month" && <input type="month" style={inputStyle} value={month} onChange={(e) => setMonth(e.target.value)} />}
                {durationFilterType === "year" && <input type="number" placeholder="YYYY" style={inputStyle} value={year} onChange={(e) => setYear(e.target.value)} />}
             </div>
             </div>
        )}
        
        {reportType !== "inventory" && (
            <>
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Category</label>
                    <select style={selectStyle} value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                        <option value="all">All Categories</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1 relative w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-[#7A8A93] uppercase tracking-wider">Equipment</label>
                    <button onClick={() => setShowEquipmentFilter(!showEquipmentFilter)} className="flex items-center justify-between px-3 py-2 bg-white border border-[#D0CBC0] rounded-[2px] w-full sm:w-[200px] text-[13px]">
                        <span className="truncate">{selectedEquipments.length === 0 ? "All Equipment" : `${selectedEquipments.length} Selected`}</span>
                        {showEquipmentFilter ? <ChevronUp size={14} className="text-[#7A8A93]" /> : <ChevronDown size={14} className="text-[#7A8A93]" />}
                    </button>
                    {showEquipmentFilter && rawData && (
                        <div className="absolute top-full left-0 mt-1 w-full sm:w-[280px] max-h-[300px] overflow-y-auto bg-white border border-[#D0CBC0] shadow-lg rounded-[2px] z-50 p-2 scroll-custom">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <span className="text-xs font-semibold text-[#225CA3]">Select Equipment</span>
                                <button onClick={() => setSelectedEquipments([])} className="text-[10px] text-[#7A8A93] hover:text-[#225CA3] uppercase tracking-wide">Clear</button>
                            </div>
                            {filteredEquipmentList.map((eq: any) => (
                                <div key={eq.id} className="flex items-center gap-2 hover:bg-[#F5F3EF] p-1.5 rounded cursor-pointer" onClick={() => handleEquipmentToggle(String(eq.id))}>
                                    <input type="checkbox" checked={selectedEquipments.includes(String(eq.id))} readOnly className="accent-[#225CA3] w-3.5 h-3.5" />
                                    <div className="flex flex-col"><span className="text-[12px] font-medium text-[#1A1A1A]">{eq.name}</span><span className="text-[10px] text-[#7A8A93]">{eq.code}</span></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 scroll-custom">
         {isLoading ? (
             <div className="flex h-full items-center justify-center text-[#7A8A93]">Loading data...</div>
         ) : !filteredData ? (
             <div className="flex h-full items-center justify-center text-[#7A8A93]">No data available.</div>
         ) : (
             <div className="bg-white border border-[#D0CBC0] shadow-sm min-h-[400px]">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F5F3EF] text-[#225CA3] text-[11px] font-bold uppercase tracking-wider sticky top-0">
                            <tr>
                                <th className="p-4 border-b border-[#D0CBC0] w-12">Sl No.</th>
                                {reportType === "tasks" && (
                                    <>
                                        <th className="p-4 border-b border-[#D0CBC0]">Task ID</th>
                                        <th className="p-4 border-b border-[#D0CBC0]">Task Name</th>
                                        <th className="p-4 border-b border-[#D0CBC0]">Equipment</th>
                                        <th className="p-4 border-b border-[#D0CBC0]">Frequency</th>
                                        <th className="p-4 border-b border-[#D0CBC0]">Last Done</th>
                                        <th className="p-4 border-b border-[#D0CBC0]">Next Due</th>
                                        <th className="p-4 border-b border-[#D0CBC0]">Status</th>
                                    </>
                                )}
                                {reportType === "equipment" && (<><th className="p-4 border-b border-[#D0CBC0]">Code</th><th className="p-4 border-b border-[#D0CBC0]">Name</th><th className="p-4 border-b border-[#D0CBC0]">Category</th><th className="p-4 border-b border-[#D0CBC0]">Model</th><th className="p-4 border-b border-[#D0CBC0]">Serial No</th><th className="p-4 border-b border-[#D0CBC0]">Unit</th><th className="p-4 border-b border-[#D0CBC0]">Qty</th><th className="p-4 border-b border-[#D0CBC0]">Location</th><th className="p-4 border-b border-[#D0CBC0]">Status</th></>)}
                                {reportType === "maintenance" && maintenanceType === "corrective" && (<><th className="p-4 border-b border-[#D0CBC0]">Date</th><th className="p-4 border-b border-[#D0CBC0]">Equipment</th><th className="p-4 border-b border-[#D0CBC0]">Problem / Fault</th><th className="p-4 border-b border-[#D0CBC0]">Action/Work</th><th className="p-4 border-b border-[#D0CBC0]">Parts Used</th><th className="p-4 border-b border-[#D0CBC0]">Status</th></>)}
                                {reportType === "maintenance" && maintenanceType !== "corrective" && (<><th className="p-4 border-b border-[#D0CBC0]">Equipment</th><th className="p-4 border-b border-[#D0CBC0]">Frequency</th><th className="p-4 border-b border-[#D0CBC0]">Target Date</th><th className="p-4 border-b border-[#D0CBC0]">Done Date</th><th className="p-4 border-b border-[#D0CBC0]">Action/Work</th><th className="p-4 border-b border-[#D0CBC0]">Parts Used</th><th className="p-4 border-b border-[#D0CBC0]">Remarks</th><th className="p-4 border-b border-[#D0CBC0]">Status</th></>)}
                                {reportType === "inventory" && (<><th className="p-4 border-b border-[#D0CBC0]">Name</th><th className="p-4 border-b border-[#D0CBC0]">Quantity</th><th className="p-4 border-b border-[#D0CBC0]">Description</th><th className="p-4 border-b border-[#D0CBC0]">SWL</th><th className="p-4 border-b border-[#D0CBC0]">Cert No.</th></>)}
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-[#1A1A1A]">
                            {reportType === "tasks" && filteredData.tasks?.map((task: any, index: number) => {
                                const eq = rawData?.equipment.find((e: any) => e.id === task.equipmentId);
                                const status = task._computedStatus || getTaskStatus(task);

                                // Status Logic
                                let statusText = status;
                                let statusColor = "bg-green-100 text-green-800";
                                let rowColor = "";
                                
                                if (status === "OVERDUE") {
                                    statusColor = "bg-red-100 text-red-800";
                                    rowColor = "bg-red-50";
                                } else if (status === "DUE") {
                                    statusColor = "bg-amber-100 text-amber-800";
                                    rowColor = "bg-amber-50";
                                }

                                return (
                                    <tr key={task.id || task.taskId} className={`border-b border-[#F0EDE6] hover:bg-[#FAFAF8] ${rowColor}`}>
                                        <td className="p-4 font-medium text-[#7A8A93]">{index + 1}</td>
                                        <td className="p-4 flex items-center gap-2">{status === "OVERDUE" && <AlertTriangle size={14} className="text-red-600" />} {task.taskId}</td>
                                        <td className="p-4 font-medium whitespace-pre-line leading-relaxed">{task.taskName}</td>
                                        <td className="p-4">{eq ? `${eq.name} (${eq.code})` : '-'}</td>
                                        <td className="p-4 capitalize">{task.frequency}</td>
                                        <td className="p-4">{task.lastCompletedDate ? format(new Date(task.lastCompletedDate), "dd MMM yyyy") : 'NEVER'}</td>
                                        <td className="p-4">{task.nextDueDate ? format(new Date(task.nextDueDate), "dd MMM yyyy") : '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {reportType === "equipment" && filteredData.equipment?.map((eq: any, index: number) => (
                                <tr key={eq.id} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8]">
                                    <td className="p-4 font-medium text-[#7A8A93]">{index + 1}</td>
                                    <td className="p-4 font-medium">{eq.code}</td><td className="p-4">{eq.name}</td><td className="p-4">{eq.category?.name}</td>
                                    <td className="p-4">{eq.model || '-'}</td><td className="p-4">{eq.serialNumber || '-'}</td><td className="p-4">{eq.location || '-'}</td>
                                    <td className="p-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${eq.status === 'active' ? 'bg-[#E6F4EA] text-[#1E4620]' : 'bg-[#F5F3EF] text-[#2D3748]'}`}>{eq.status}</span></td>
                                </tr>
                            ))}
                            {reportType === "maintenance" && filteredData.maintenance?.map((m: any, index: number) => {
                                const date = m.type === 'corrective' ? m.serviceEndDate : m.maintenanceDate;
                                let wasDateOverdue = false;
                                if (m.targetDate && m.maintenanceDate) {
                                    const tDate = new Date(m.targetDate);
                                    tDate.setHours(0,0,0,0);
                                    const mDate = new Date(m.maintenanceDate);
                                    mDate.setHours(0,0,0,0);
                                    wasDateOverdue = mDate > tDate;
                                }
                                const wasHoursOverdue = m.targetHours && m.runningHours && m.runningHours >= m.targetHours;
                                const wasLate = m._computedLate !== undefined ? m._computedLate : (wasDateOverdue || wasHoursOverdue);

                                if (maintenanceType === "corrective") {
                                    return (
                                        <tr key={m.id || `${m.equipmentId}-${m.maintenanceDate}`} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8]">
                                            <td className="p-4 font-medium text-[#7A8A93]">{index + 1}</td>
                                            <td className="p-4">{date ? format(new Date(date), "dd MMM yyyy") : '-'}</td>
                                            <td className="p-4 font-medium">{m.equipment?.name} <span className="text-[#4A5568]">({m.equipment?.code})</span></td>
                                            <td className="p-4 truncate max-w-[200px] whitespace-pre-line leading-relaxed">{m.problemDescription || '-'}</td>
                                            <td className="p-4 truncate max-w-[200px] whitespace-pre-line leading-relaxed">{m.solutionDetails || '-'}</td>
                                            <td className="p-4">{m.usedParts || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${wasLate ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                    {wasLate ? 'Performed Late' : 'On-Time'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    return (
                                        <tr key={m.id || `${m.equipmentId}-${m.maintenanceDate}`} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8]">
                                            <td className="p-4 font-medium text-[#7A8A93]">{index + 1}</td>
                                            <td className="p-4 font-medium">{m.equipment?.name} <span className="text-[#4A5568]">({m.equipment?.code})</span></td>
                                            <td className="p-4 truncate max-w-[150px] whitespace-pre-line leading-relaxed">{m.task?.taskName || m.maintenanceDetails || '-'}</td>
                                            <td className="p-4">{m.maintenanceDate ? format(new Date(m.maintenanceDate), "dd MMM yyyy") : '-'}</td>
                                            <td className="p-4">{m.targetDate ? format(new Date(m.targetDate), "dd MMM yyyy") : '-'}</td>
                                            <td className="p-4 truncate max-w-[200px] whitespace-pre-line leading-relaxed">{m.solutionDetails || '-'}</td>
                                            <td className="p-4 truncate max-w-[150px] whitespace-pre-line leading-relaxed">{m.usedParts || '-'}</td>
                                            <td className="p-4 truncate max-w-[150px] whitespace-pre-line leading-relaxed">{m.remarks || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${wasLate ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                    {wasLate ? 'Performed Late' : 'On-Time'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }
                            })}
                            {reportType === "inventory" && filteredData.inventory?.map((item: any, index: number) => (
                                <tr key={item.id} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8]">
                                    <td className="p-4 font-medium text-[#7A8A93]">{index + 1}</td>
                                    <td className="p-4 font-medium">{item.name}</td><td className="p-4">{item.quantity || '-'}</td>
                                    <td className="p-4 truncate max-w-[300px]">{item.description || '-'}</td><td className="p-4">{item.swl || '-'}</td>
                                    <td className="p-4 font-mono text-xs">{item.certificateNo || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
}
