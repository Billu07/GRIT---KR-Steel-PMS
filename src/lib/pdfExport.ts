/**
 * pdfExport.ts
 * Shared branded PDF export utility for GRIT — KR Steel Ship Recycling Facility
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, differenceInMinutes } from "date-fns";
import { getTaskStatus } from "./taskUtils";

const LOGO_BASE64 = "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";

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
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("GRIT SYSTEM", pw - 14, 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.accent);
  doc.text("GEAR RELIABILITY & INTERVENTION TRACKER", pw - 14, 16, { align: "right" });

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
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    if (y > ph - 35) { doc.addPage(); y = 40; }
    const sigY = y + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.navy);
    const cols = ["YARD MANAGER", "PRODUCTION IN-CHARGE", "WIRE FOREMAN", "MAINTENANCE IN-CHARGE"];
    const colWidth = (pw - 28) / 4;
    cols.forEach((label, i) => {
        const x = 14 + (i * colWidth) + (colWidth / 2);
        doc.text("_______________________", x, sigY - 2, { align: "center" });
        doc.text(label, x, sigY + 2, { align: "center" });
    });
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
    if (index > 0) { startY = (doc as any).lastAutoTable.finalY + 10; if (startY > 170) { doc.addPage(); startY = 35; } }
    doc.setFillColor(...C.paste); 
    doc.rect(14, startY, doc.internal.pageSize.getWidth()-28, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.navy); doc.text(groupName.toUpperCase(), 18, startY + 4.2);
    startY += 8;
    const rows = groupTasks.map((t: any) => {
        const eq = equipment.find((e: any) => e.id === t.equipmentId);
        const statusText = getTaskStatus(t);
        
        return [
          t.taskId, 
          t.taskName, 
          eq?.code || "—", 
          t.frequency?.toUpperCase() || "—", 
          t.lastCompletedDate ? format(new Date(t.lastCompletedDate), "dd/MM/yy") : "NEVER",
          t.nextDueDate ? format(new Date(t.nextDueDate), "dd/MM/yy") : "—", 
          `${t.runningHours || 0}/${t.estimatedHours || "—"}`,
          statusText,
          t.taskDetail || "—"
        ];
    });
    autoTable(doc, { 
      ...tableDefaults(startY, meta), 
      head: [["ID", "TASK NAME", "EQ CODE", "FREQ", "LAST DONE", "NEXT DUE", "HRS (R/E)", "STATUS", "DETAIL"]], 
      body: rows,
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 40 }, 7: { fontStyle: 'bold' } }
    });
  });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Tasks_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportEquipmentReportPdf({ equipment, groupBy }: { equipment: any[], groupBy: string }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const meta: PdfMeta = { title: "Shipyard Equipment Registry", subtitle: `Master Asset List · Grouped by ${groupBy}`, orientation: "l" };
  let startY = drawHeader(doc, meta, true);
  const grouped = equipment.reduce((acc: any, eq: any) => {
    const key = groupBy === "category" ? eq.category?.name || "Uncategorized" : "All Equipment";
    if (!acc[key]) acc[key] = []; acc[key].push(eq); return acc;
  }, {});
  Object.entries(grouped).forEach(([groupName, groupEq]: [string, any], index) => {
    if (index > 0) { startY = (doc as any).lastAutoTable.finalY + 10; if (startY > 170) { doc.addPage(); startY = 35; } }
    doc.setFillColor(...C.paste); 
    doc.rect(14, startY, doc.internal.pageSize.getWidth()-28, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.navy); doc.text(groupName.toUpperCase(), 18, startY + 4.2);
    startY += 8;
    const rows = groupEq.map((eq: any) => [
        eq.code, eq.name, eq.brand || "—", eq.model || "—", eq.serialNumber || "—", eq.capacity || "—", eq.location || "—", eq.runningHours || "—", eq.status.toUpperCase()
    ]);
    autoTable(doc, { 
        ...tableDefaults(startY, meta), 
        head: [["CODE", "NAME", "BRAND", "MODEL", "SERIAL NO", "CAPACITY", "LOCATION", "HRS", "STATUS"]], 
        body: rows 
    });
  });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Asset_Registry_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportMaintenancePdf({ data, type }: { data: any[], type: "corrective" | "preventive" }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const meta: PdfMeta = { title: `${type === "corrective" ? "Corrective (Breakdown)" : "Preventive (Scheduled)"} Maintenance Report`, subtitle: `KR Steel Ship Recycling Yard · Maintenance Operations Log`, orientation: "l" };
  const startY = drawHeader(doc, meta, true);

  const head = type === "corrective" 
    ? [["TIMELINE / DATES", "EQUIPMENT IDENTITY", "SPECS / DURATIONS", "PROBLEM / FAULT", "WORK PERFORMED", "PARTS / REMARKS"]]
    : [["DATE COMPLETED", "EQUIPMENT / SPECS", "TASK / FREQ", "TARGETS (DATE/HRS)", "ACTUAL (HRS/STATUS)", "WORK DONE / REMARKS", "PARTS"]];

  const rows = data.map((item: any) => {
    const eqInfo = item.equipment ? `${item.equipment.name}\n${item.equipment.code}\nMod: ${item.equipment.model || 'N/A'}\nS/N: ${item.equipment.serialNumber || 'N/A'}` : "—";
    
    if (type === "corrective") {
      const information = item.informationDate ? new Date(item.informationDate) : null;
      const start = item.serviceStartDate ? new Date(item.serviceStartDate) : null;
      const end = item.serviceEndDate ? new Date(item.serviceEndDate) : null;

      let repairTime = '—';
      if (start && end) {
        const mins = differenceInMinutes(end, start);
        repairTime = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }

      let downtime = '—';
      if (information && end) {
        const mins = differenceInMinutes(end, information);
        downtime = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }

      const timeline = `Rep: ${information ? format(information, 'dd/MM/yy') : '—'}\nSrv: ${start ? format(start, 'dd/MM/yy') : '—'}\nEnd: ${end ? format(end, 'dd/MM/yy') : '—'}`;
      const jobSpecs = `Sev: ${item.problemType?.toUpperCase() || '—'}\nJob: ${item.workType?.toUpperCase() || '—'}\nRep: ${repairTime}\nDT: ${downtime}`;
      const footer = `${item.usedParts ? 'Parts: ' + item.usedParts : ''}${item.remarks ? (item.usedParts ? '\n' : '') + 'Rem: ' + item.remarks : ''}`;

      return [timeline, eqInfo, jobSpecs, item.problemDescription || "—", item.solutionDetails || "—", footer || "—"];
    } else {
      const date = item.maintenanceDate ? format(new Date(item.maintenanceDate), 'dd/MM/yyyy') : (item.performedAt ? format(new Date(item.performedAt), 'dd/MM/yyyy') : "—");
      const taskInfo = `${item.task?.taskId || 'PREV'}\n${item.task?.taskName || 'MAINT'}\nFreq: ${item.task?.frequency?.toUpperCase() || '—'}`;
      
      const targets = `Due: ${item.targetDate ? format(new Date(item.targetDate), 'dd/MM/yy') : 'N/A'}\nTar: ${item.targetHours || '—'} hrs`;
      
      const wasDateOverdue = item.targetDate && item.maintenanceDate && new Date(item.maintenanceDate) > new Date(item.targetDate);
      const wasHoursOverdue = item.targetHours && item.runningHours && item.runningHours >= item.targetHours;
      const status = (wasDateOverdue || wasHoursOverdue) ? "LATE / OVER" : "ON-TIME";
      const usage = `Run: ${item.runningHours || '0'} hrs\nStat: ${status}`;
      
      const details = `${item.maintenanceDetails || item.problemDescription || "—"}${item.remarks ? '\n\nRemarks: ' + item.remarks : ''}`;
      return [date, eqInfo, taskInfo, targets, usage, details, item.usedParts || "—"];
    }
  });

  autoTable(doc, { 
    ...tableDefaults(startY, meta), head, body: rows,
    columnStyles: { 
        0: { cellWidth: type === "corrective" ? 32 : 25 }, 
        1: { cellWidth: type === "corrective" ? 40 : 40 }, 
        2: { cellWidth: type === "corrective" ? 30 : 35 }, 
        3: { cellWidth: type === "corrective" ? 45 : 30 }, 
        4: { cellWidth: type === "corrective" ? 45 : 30 },
        5: { cellWidth: type === "corrective" ? 30 : 45 } 
    }
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

  const rows = tasks.map((t: any) => {
    const statusText = getTaskStatus(t);

    return [
      t.taskId, 
      t.taskName, 
      t.frequency?.toUpperCase() || "—", 
      t.lastCompletedDate ? format(new Date(t.lastCompletedDate), "dd/MM/yy") : "NEVER",
      t.nextDueDate ? format(new Date(t.nextDueDate), "dd/MM/yy") : "—", 
      t.criticality?.toUpperCase() || "—", 
      `${t.runningHours || 0}/${t.estimatedHours || "—"}`,
      statusText,
      t.taskDetail || "—"
    ];
  });

  autoTable(doc, { 
    ...tableDefaults(startY, meta), 
    head: [["ID", "TASK NAME", "FREQUENCY", "LAST DONE", "NEXT DUE", "CRITICALITY", "HRS (R/E)", "STATUS", "DETAILS"]], 
    body: rows,
    columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 45 }, 7: { fontStyle: 'bold' } }
  });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Tasks_${equipment.code}_${format(new Date(), "yyyyMMdd")}.pdf`);
}
