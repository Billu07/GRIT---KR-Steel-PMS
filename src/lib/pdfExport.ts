/**
 * pdfExport.ts
 * Shared branded PDF export utility for GRIT — KR Steel Ship Recycling Facility
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, differenceInMinutes } from "date-fns";
import { getTaskStatus } from "./taskUtils";

export const LOGO_BASE64 = "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";

const C = {
  navy: [12, 44, 88] as [number, number, number], 
  accent: [28, 165, 206] as [number, number, number], 
  paste: [234, 231, 223] as [number, number, number], 
  pasteLight: [250, 249, 247] as [number, number, number], 
  rule: [180, 175, 160] as [number, number, number], 
  ink: [20, 20, 20] as [number, number, number], 
  muted: [100, 110, 120] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export interface PdfMeta {
  title: string;
  subtitle?: string;
  orientation?: "p" | "l";
}

function drawHeader(doc: jsPDF, meta: PdfMeta, isFirstPage: boolean = true): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pw, 26, "F");
  doc.setFillColor(...C.accent);
  doc.rect(0, 25, pw, 0.8, "F");

  // White background for logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 4, 18, 18, 1, 1, "F");

  try {
    doc.addImage(LOGO_BASE64, "PNG", 13, 5, 16, 16, undefined, 'FAST');
  } catch (e) {
    console.error("PDF Logo Error:", e);
  }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text("KR STEEL", 34, 12);
  doc.setFontSize(7);
  doc.setTextColor(...C.accent);
  doc.text("SHIP RECYCLING FACILITY", 34, 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("GRIT - GEAR RELIABILITY & INTERVENTION TRACKER", pw - 14, 15, { align: "right" });

  if (!isFirstPage) return 32;

  doc.setFillColor(...C.pasteLight);
  doc.rect(0, 26, pw, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.navy);
  doc.text(meta.title.toUpperCase(), 14, 38);

  if (meta.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(meta.subtitle, 14, 44);
  }

  doc.setFontSize(7);
  doc.text(`PRINTED: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, pw - 14, 44, { align: "right" });
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.line(14, 48, pw - 14, 48);

  return 54; 
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.2);
  doc.line(14, ph - 12, pw - 14, ph - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.muted);
  doc.text("KR STEEL SRF · ASSET MANAGEMENT · CONFIDENTIAL", 14, ph - 8);
  doc.text(`PAGE ${pageNum} OF ${totalPages}`, pw - 14, ph - 8, { align: "right" });
}

function drawSignatures(doc: jsPDF, y: number) {
    // Signature block removed as requested
}

const tableDefaults = (startY: number, meta: PdfMeta) => ({
  startY,
  margin: { left: 14, right: 14, top: 32, bottom: 20 },
  styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, textColor: C.ink, lineColor: C.rule, lineWidth: 0.1 },
  headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: "bold" as const, fontSize: 7.5 },
  alternateRowStyles: { fillColor: [253, 253, 252] as [number, number, number] },
  didDrawPage: (data: any) => {
      drawHeader(data.doc, meta, data.pageNumber === 1);
  }
});

export function exportToPDF(title: string, head: any[][], body: any[][], filename: string = "Report") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const meta: PdfMeta = { title, orientation: "l" };
  const startY = drawHeader(doc, meta, true);
  autoTable(doc, { ...tableDefaults(startY, meta), head, body, tableWidth: 269 });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`${filename}_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportTaskReportPdf({ tasks, equipment, groupBy }: { tasks: any[], equipment: any[], groupBy: string }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const meta: PdfMeta = { title: "Scheduled Maintenance Tasks", subtitle: `Grouping: ${groupBy}`, orientation: "l" };
  let startY = drawHeader(doc, meta, true);
  const grouped = tasks.reduce((acc: any, task: any) => {
    const eq = equipment.find((e: any) => e.id === task.equipmentId);
    let key = groupBy === "category" ? eq?.category?.name || "Uncategorized" : (groupBy === "equipment" ? `${eq?.name} (${eq?.code})` : "All Tasks");
    if (!acc[key]) acc[key] = []; acc[key].push(task); return acc;
  }, {});

  Object.entries(grouped).forEach(([groupName, groupTasks]: [string, any], index) => {
    // Force a page break if there's less than ~50mm of space left to prevent header/table splitting awkwardly
    if (index > 0) { 
        startY = (doc as any).lastAutoTable.finalY + 10; 
        if (startY > doc.internal.pageSize.getHeight() - 50) { 
            doc.addPage(); 
            startY = 35; 
        } 
    }

    let headerPrefix = "";
    if (groupBy === "category" && groupName !== "All Tasks") headerPrefix = "CATEGORY: ";
    else if (groupBy === "equipment" && groupName !== "All Tasks") headerPrefix = "EQUIPMENT: ";

    doc.setFillColor(...C.paste); 
    doc.rect(14, startY, doc.internal.pageSize.getWidth()-28, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...C.navy); 
    doc.text(`${headerPrefix}${groupName.toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, startY + 5.5, { align: "center" });
    startY += 10;
    const rows = groupTasks.map((t: any, idx: number) => {
        const eq = equipment.find((e: any) => e.id === t.equipmentId);
        const statusText = getTaskStatus(t);
        
        return [
          idx + 1,
          t.taskId, 
          t.taskName, 
          eq?.code || "—", 
          t.frequency?.toUpperCase() || "—", 
          t.lastCompletedDate ? format(new Date(t.lastCompletedDate), "dd/MM/yy") : "NEVER",
          t.nextDueDate ? format(new Date(t.nextDueDate), "dd/MM/yy") : "—", 
          statusText,
          t.taskDetail || "—"
        ];
    });
    autoTable(doc, { 
      ...tableDefaults(startY, meta), 
      head: [["SL NO", "ID", "TASK NAME", "EQ CODE", "FREQ", "LAST DONE", "NEXT DUE", "STATUS", "REMARKS"]], 
      body: rows,
      tableWidth: 269,
      columnStyles: { 
        0: { cellWidth: 10 }, 
        1: { cellWidth: 15 }, 
        2: { cellWidth: 50 }, 
        3: { cellWidth: 25 }, 
        4: { cellWidth: 25 }, 
        5: { cellWidth: 25 }, 
        6: { cellWidth: 25 }, 
        7: { cellWidth: 20 }, 
        8: { cellWidth: 74, fontStyle: 'bold' } 
      }
    });
  });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Tasks_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportEquipmentReportPdf({ equipment, groupBy }: { equipment: any[], groupBy: string }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
  let dynamicSubtitle = `Master Asset List · Grouped by ${groupBy}`;
  if (groupBy === 'none' && equipment.length > 0) {
      const firstCat = equipment[0].category?.name;
      const allSameCategory = equipment.every((eq: any) => eq.category?.name === firstCat);
      if (allSameCategory && firstCat) {
          dynamicSubtitle = `Category: ${firstCat}`;
      } else {
          dynamicSubtitle = "All Equipment";
      }
  }

  const meta: PdfMeta = { title: "Shipyard Equipment Registry", subtitle: dynamicSubtitle, orientation: "l" };
  let startY = drawHeader(doc, meta, true);
  const grouped = equipment.reduce((acc: any, eq: any) => {
    const key = groupBy === "category" ? eq.category?.name || "Uncategorized" : "All Equipment";
    if (!acc[key]) acc[key] = []; acc[key].push(eq); return acc;
  }, {});
  Object.entries(grouped).forEach(([groupName, groupEq]: [string, any], index) => {
    if (index > 0) { startY = (doc as any).lastAutoTable.finalY + 10; if (startY > 170) { doc.addPage(); startY = 35; } }
    
    let headerPrefix = "";
    if (groupBy === "category" && groupName !== "All Equipment") headerPrefix = "CATEGORY: ";

    doc.setFillColor(...C.paste); 
    doc.rect(14, startY, doc.internal.pageSize.getWidth()-28, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...C.navy); 
    doc.text(`${headerPrefix}${groupName.toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, startY + 5.5, { align: "center" });
    startY += 10;
    const rows = groupEq.map((eq: any, idx: number) => [
        idx + 1, eq.code, eq.name, eq.brand || "—", eq.model || "—", eq.serialNumber || "—", eq.capacity || "—", eq.unit || "—", eq.quantity || "—", eq.location || "—", eq.status.toUpperCase()
    ]);
    autoTable(doc, { 
        ...tableDefaults(startY, meta), 
        head: [["SL NO", "CODE", "NAME", "BRAND", "MODEL", "SERIAL NO", "CAPACITY", "UNIT", "QTY", "LOCATION", "STATUS"]], 
        body: rows,
        tableWidth: 269,
        columnStyles: { 
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 40 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
          6: { cellWidth: 25 },
          7: { cellWidth: 15 },
          8: { cellWidth: 15 },
          9: { cellWidth: 30 },
          10: { cellWidth: 24 }
        }
    });
  });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Asset_Registry_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportMaintenancePdf({ data, type }: { data: any[], type: "corrective" | "preventive" }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
  let dynamicSubtitle = "KR Steel Ship Recycling Yard · Maintenance Operations Log";
  
  if (data.length > 0) {
      const firstEq = data[0].equipment;
      if (firstEq) {
          const allSameCategory = data.every(d => d.equipment?.categoryId === firstEq.categoryId);
          const allSameEq = data.every(d => d.equipmentId === firstEq.id);
          if (allSameEq) {
              dynamicSubtitle = `Equipment: ${firstEq.name} (${firstEq.code})`;
          } else if (allSameCategory && firstEq.category?.name) {
              dynamicSubtitle = `Category: ${firstEq.category.name}`;
          }
      }
  }

  const meta: PdfMeta = { title: `${type === "corrective" ? "Corrective (Breakdown)" : "Preventive (Scheduled)"} Maintenance Report`, subtitle: dynamicSubtitle, orientation: "l" };
  let startY = drawHeader(doc, meta, true);

  const head = type === "corrective" 
    ? [["SL NO", "EQUIPMENT IDENTITY", "START DATE", "END DATE", "DURATION", "PROBLEM / FAULT", "WORK PERFORMED", "PARTS / REMARKS"]]
    : [["SL NO", "EQUIPMENT / SPECS", "FREQUENCY", "TARGET DATE", "DONE DATE", "STATUS", "WORK DONE", "PARTS", "REMARKS"]];

  // 1. Sort the entire data array ASCENDING (Oldest First)
  const sortedData = [...data].sort((a: any, b: any) => {
      const dateA = type === "corrective" 
        ? (a.serviceEndDate ? new Date(a.serviceEndDate).getTime() : 0)
        : (a.maintenanceDate ? new Date(a.maintenanceDate).getTime() : 0);
      const dateB = type === "corrective" 
        ? (b.serviceEndDate ? new Date(b.serviceEndDate).getTime() : 0)
        : (b.maintenanceDate ? new Date(b.maintenanceDate).getTime() : 0);
      return dateA - dateB;
  });

  // 2. Group sorted data while preserving order
  const grouped = sortedData.reduce((acc: any, item: any) => {
    let dateStr = "UNKNOWN DATE";
    if (type === "corrective") {
      dateStr = item.serviceEndDate ? format(new Date(item.serviceEndDate), "dd MMM yyyy") : "UNKNOWN DATE";
    } else {
      dateStr = item.maintenanceDate ? format(new Date(item.maintenanceDate), "dd MMM yyyy") : "UNKNOWN DATE";
    }
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  // 3. Render groups in order (Must sort entries to ensure chronological Banner order)
  const sortedEntries = Object.entries(grouped).sort((a: any, b: any) => {
    if (a[0] === "UNKNOWN DATE") return 1;
    if (b[0] === "UNKNOWN DATE") return -1;
    return new Date(a[0]).getTime() - new Date(b[0]).getTime();
  });

  sortedEntries.forEach(([dateGroup, groupData]: [string, any], index) => {
    if (index > 0) { 
        startY = (doc as any).lastAutoTable.finalY + 10; 
        if (startY > doc.internal.pageSize.getHeight() - 40) { 
            doc.addPage(); 
            startY = 35; 
        } 
    }
    
    doc.setFillColor(...C.paste); 
    doc.rect(14, startY, doc.internal.pageSize.getWidth()-28, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...C.navy); 
    doc.text(`DATE: ${dateGroup.toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, startY + 5.5, { align: "center" });
    startY += 10;

    const rows = groupData.map((item: any, idx: number) => {
      const eqInfo = item.equipment ? `${item.equipment.name}\n${item.equipment.code}\nMod: ${item.equipment.model || 'N/A'}\nS/N: ${item.equipment.serialNumber || 'N/A'}` : "—";

      if (type === "corrective") {
        const start = item.serviceStartDate ? new Date(item.serviceStartDate) : null;
        const end = item.serviceEndDate ? new Date(item.serviceEndDate) : null;
        let repairTime = '—';
        if (start && end) {
          const mins = differenceInMinutes(end, start);
          repairTime = `${Math.floor(mins / 60)}h ${mins % 60}m`;
        }
        const startDate = start ? format(start, 'dd/MM/yy HH:mm') : '—';
        const endDate = end ? format(end, 'dd/MM/yy HH:mm') : '—';
        const footer = `${item.usedParts ? 'Parts: ' + item.usedParts : ''}${item.remarks ? (item.usedParts ? '\n' : '') + 'Rem: ' + item.remarks : ''}`;
        return [idx + 1, eqInfo, startDate, endDate, repairTime, item.problemDescription || "—", item.solutionDetails || "—", footer || "—"];
      } else {
        const taskInfo = item.maintenanceDetails || item.task?.frequency?.toUpperCase() || '—';      
        const doneDate = item.maintenanceDate ? format(new Date(item.maintenanceDate), 'dd/MM/yy') : '—';
        const targets = item.targetDate ? format(new Date(item.targetDate), 'dd/MM/yy') : '—';
        let wasDateOverdue = false;
        if (item.targetDate && item.maintenanceDate) {
           const tDate = new Date(item.targetDate); tDate.setHours(0,0,0,0);
           const mDate = new Date(item.maintenanceDate); mDate.setHours(0,0,0,0);
           wasDateOverdue = mDate > tDate;
        }
        return [idx + 1, eqInfo, taskInfo, targets, doneDate, wasDateOverdue ? "LATE" : "ON-TIME", item.solutionDetails || "—", item.usedParts || "—", item.remarks || "—"];
      }
    });

    autoTable(doc, { 
      ...tableDefaults(startY, meta), head, body: rows,
      tableWidth: 269,
      columnStyles: type === "corrective" ? { 
          0: { cellWidth: 10 }, 1: { cellWidth: 40 }, 2: { cellWidth: 30 }, 3: { cellWidth: 30 }, 
          4: { cellWidth: 25 }, 5: { cellWidth: 50 }, 6: { cellWidth: 50 }, 7: { cellWidth: 34 }
      } : {
          0: { cellWidth: 10 }, 1: { cellWidth: 40 }, 2: { cellWidth: 28 }, 3: { cellWidth: 24 }, 
          4: { cellWidth: 24 }, 5: { cellWidth: 22 }, 6: { cellWidth: 52 }, 7: { cellWidth: 18 }, 8: { cellWidth: 51 }
      }
    });
  });

  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_${type}_Maintenance_Log_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportEquipmentTasksPdf({ equipment, tasks }: { equipment: any; tasks: any[]; }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const meta: PdfMeta = { title: `Asset Task List: ${equipment.name}`, subtitle: `Code: ${equipment.code} · Location: ${equipment.location}`, orientation: "l" };
  const startY = drawHeader(doc, meta, true);

  const rows = tasks.map((t: any, idx: number) => {
    const statusText = getTaskStatus(t);

    return [
      idx + 1,
      t.taskId, 
      t.taskName, 
      t.frequency?.toUpperCase() || "—", 
      t.lastCompletedDate ? format(new Date(t.lastCompletedDate), "dd/MM/yy") : "NEVER",
      t.nextDueDate ? format(new Date(t.nextDueDate), "dd/MM/yy") : "—", 
      t.criticality?.toUpperCase() || "—", 
      statusText,
      t.taskDetail || "—"
    ];
  });

  autoTable(doc, { 
    ...tableDefaults(startY, meta), 
    head: [["SL NO", "ID", "TASK NAME", "FREQUENCY", "LAST DONE", "NEXT DUE", "CRITICALITY", "STATUS", "REMARKS"]], 
    body: rows,
    tableWidth: 269,
    columnStyles: { 
      0: { cellWidth: 10 }, 
      1: { cellWidth: 15 }, 
      2: { cellWidth: 45 }, 
      3: { cellWidth: 30 }, 
      4: { cellWidth: 25 }, 
      5: { cellWidth: 25 }, 
      6: { cellWidth: 25 }, 
      7: { cellWidth: 20 }, 
      8: { cellWidth: 74, fontStyle: 'bold' } 
    }
  });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Tasks_${equipment.code}_${format(new Date(), "yyyyMMdd")}.pdf`);
}
