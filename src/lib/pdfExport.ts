/**
 * pdfExport.ts
 * Shared branded PDF export utility for GRIT - KR Steel Ship Recycling Facility
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, differenceInMinutes } from "date-fns";
import { getTaskStatus } from "./taskUtils";
import { LOGO_BASE64 } from "./logoData";

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
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.navy);
    doc.text(meta.subtitle, 14, 44);
  }

  doc.setFontSize(7);
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
    // We draw the header on every page. 
    // CRITICAL FIX: Only draw the full header (with title) on the absolute first page of the PDF.
    // data.pageNumber in autoTable is relative to the table, not the document.
    const isAbsoluteFirstPage = data.doc.internal.getCurrentPageInfo().pageNumber === 1;
    drawHeader(data.doc, meta, isAbsoluteFirstPage);
  }
});

export function exportToPDF(title: string, head: any[][], body: any[][], filename: string = "Report") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const meta: PdfMeta = { title, orientation: "l" };
  const startY = drawHeader(doc, meta, true);
  autoTable(doc, { ...tableDefaults(startY, meta), head, body });
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
    doc.rect(14, startY, doc.internal.pageSize.getWidth() - 28, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...C.navy);
    doc.text(`${headerPrefix}${groupName.toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, startY + 5.5, { align: "center" });
    startY += 10;
    const rows = groupTasks.map((t: any, idx: number) => {
      const eq = equipment.find((e: any) => e.id === t.equipmentId);

      return [
        idx + 1,
        eq?.code || "-",
        eq?.name || "-",
        t.taskId,
        t.taskName,
        t.frequency?.toUpperCase() || "-",
      ];
    });
    autoTable(doc, {
      ...tableDefaults(startY, meta),
      head: [["SL NO", "EQ CODE", "EQ NAME", "TASK ID", "TASK NAME", "FREQ"]],
      body: rows,
      columnStyles: { 
        0: { cellWidth: 12 }, 
        1: { cellWidth: 25 }, 
        2: { cellWidth: 40 }, 
        3: { cellWidth: 20 }, 
        4: { cellWidth: 'auto' }, 
        5: { cellWidth: 25 } 
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
    doc.rect(14, startY, doc.internal.pageSize.getWidth() - 28, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...C.navy);
    doc.text(`${headerPrefix}${groupName.toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, startY + 5.5, { align: "center" });
    startY += 10;
    const rows = groupEq.map((eq: any, idx: number) => [
      idx + 1, eq.code, eq.name, eq.brand || "-", eq.model || "-", eq.serialNumber || "-", eq.capacity || "-", eq.unit || "-", eq.quantity || "-", eq.location || "-", eq.status.toUpperCase()
    ]);
    autoTable(doc, {
      ...tableDefaults(startY, meta),
      head: [["SL NO", "CODE", "NAME", "BRAND", "MODEL", "SERIAL NO", "CAPACITY", "UNIT", "QTY", "LOCATION", "STATUS"]],
      body: rows,
      columnStyles: { 0: { cellWidth: 10 } }
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

  // Basic heuristic to detect if we're filtering by a single category or equipment
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

  const grouped = data.reduce((acc: any, item: any) => {
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

  Object.entries(grouped).forEach(([dateGroup, groupData]: [string, any], index) => {
    if (index > 0) { startY = (doc as any).lastAutoTable.finalY + 10; if (startY > 170) { doc.addPage(); startY = 35; } }

    doc.setFillColor(...C.paste);
    doc.rect(14, startY, doc.internal.pageSize.getWidth() - 28, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...C.navy);
    doc.text(`DATE: ${dateGroup.toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, startY + 5.5, { align: "center" });
    startY += 10;

    const rows = groupData.map((item: any, idx: number) => {
      const eqInfo = item.equipment ? `${item.equipment.name}\n${item.equipment.code}\nMod: ${item.equipment.model || 'N/A'}\nS/N: ${item.equipment.serialNumber || 'N/A'}` : "-";

      if (type === "corrective") {
        const start = item.serviceStartDate ? new Date(item.serviceStartDate) : null;
        const end = item.serviceEndDate ? new Date(item.serviceEndDate) : null;

        let repairTime = '-';
        if (start && end) {
          const mins = differenceInMinutes(end, start);
          repairTime = `${Math.floor(mins / 60)}h ${mins % 60}m`;
        }

        const startDate = start ? format(start, 'dd/MM/yy HH:mm') : '-';
        const endDate = end ? format(end, 'dd/MM/yy HH:mm') : '-';
        const footer = `${item.usedParts ? 'Parts: ' + item.usedParts : ''}${item.remarks ? (item.usedParts ? '\n' : '') + 'Rem: ' + item.remarks : ''}`;

        return [idx + 1, eqInfo, startDate, endDate, repairTime, item.problemDescription || "-", item.solutionDetails || "-", footer || "-"];
      } else {
        const taskInfo = item.maintenanceDetails || item.task?.frequency?.toUpperCase() || '-';
        const doneDate = item.maintenanceDate ? format(new Date(item.maintenanceDate), 'dd/MM/yy') : '-';
        const targets = item.targetDate ? format(new Date(item.targetDate), 'dd/MM/yy') : '-';
        let wasDateOverdue = false;
        if (item.targetDate && item.maintenanceDate) {
          // Use local date strings (YYYY-MM-DD) for comparison to avoid UTC day-shifts
          const tStr = format(new Date(item.targetDate), 'yyyy-MM-dd');
          const mStr = format(new Date(item.maintenanceDate), 'yyyy-MM-dd');
          
          wasDateOverdue = mStr > tStr;
        }
        const status = wasDateOverdue ? "LATE" : "ON-TIME";
        const details = item.solutionDetails || "-";
        const remarks = item.remarks || "-";
        return [idx + 1, eqInfo, taskInfo, targets, doneDate, status, details, item.usedParts || "-", remarks];
      }
    });

    autoTable(doc, {
      ...tableDefaults(startY, meta), head, body: rows,
      columnStyles: type === "corrective" ? {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 50 },
        6: { cellWidth: 50 },
        7: { cellWidth: 34 }
      } : {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 28 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 22 },
        6: { cellWidth: 50 },
        7: { cellWidth: 21 },
        8: { cellWidth: 50 }
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
    return [
      idx + 1,
      t.taskId,
      t.taskName,
      t.frequency?.toUpperCase() || "-",
      t.criticality?.toUpperCase() || "-",
    ];
  });

  autoTable(doc, {
    ...tableDefaults(startY, meta),
    head: [["SL NO", "ID", "TASK NAME", "FREQUENCY", "CRITICALITY"]],
    body: rows,
    columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 25 }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 35 }, 4: { cellWidth: 35 } }
  });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Tasks_${equipment.code}_${format(new Date(), "yyyyMMdd")}.pdf`);
}
