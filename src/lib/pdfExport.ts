/**
 * pdfExport.ts
 * Shared branded PDF export utility for GRIT — KR Steel Ship Recycling Facility
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

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

  try {
    doc.addImage(LOGO_BASE64, "PNG", 14, 4, 16, 16, undefined, 'FAST');
  } catch (e) {}
  
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
        return [t.taskId, t.taskName, eq?.name || "—", t.frequency?.toUpperCase(), t.taskDetail || "—"];
    });
    autoTable(doc, { ...tableDefaults(startY, meta), head: [["ID", "TASK NAME", "EQUIPMENT", "FREQ", "DETAIL"]], body: rows });
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
    ? [["TIMELINE", "EQUIPMENT / SPECS", "JOB SPECS", "OBSERVATIONS", "WORK DONE", "PARTS", "REMARKS"]]
    : [["DATE", "EQUIPMENT / SPECS", "TASK INFO", "OBSERVATIONS", "WORK DONE", "PARTS", "REMARKS"]];

  const rows = data.map((item: any) => {
    const eqInfo = item.equipment ? `${item.equipment.name}\n${item.equipment.code}\nMod: ${item.equipment.model || 'N/A'}\nS/N: ${item.equipment.serialNumber || 'N/A'}` : "—";
    
    if (type === "corrective") {
      const timeline = `Rep: ${item.informationDate ? format(new Date(item.informationDate), 'dd/MM/yy') : '—'}\nSrv: ${item.serviceStartDate ? format(new Date(item.serviceStartDate), 'dd/MM/yy') : '—'}\nEnd: ${item.serviceEndDate ? format(new Date(item.serviceEndDate), 'dd/MM/yy') : '—'}`;
      const jobSpecs = `${item.problemType?.toUpperCase()}\n${item.workType?.toUpperCase()} JOB`;
      return [timeline, eqInfo, jobSpecs, item.problemDescription || "—", item.solutionDetails || "—", item.usedParts || "—", item.remarks || "—"];
    } else {
      const date = item.maintenanceDate ? format(new Date(item.maintenanceDate), 'dd/MM/yy') : (item.performedAt ? format(new Date(item.performedAt), 'dd/MM/yy') : "—");
      const taskInfo = `${item.task?.taskId || 'PREV'}\n${item.task?.taskName || 'MAINT'}`;
      return [date, eqInfo, taskInfo, item.maintenanceDetails || item.problemDescription || "—", item.solutionDetails || "—", item.usedParts || "—", item.remarks || "—"];
    }
  });

  autoTable(doc, { 
    ...tableDefaults(startY, meta), head, body: rows,
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 40 }, 2: { cellWidth: 28 }, 3: { cellWidth: 45 }, 4: { cellWidth: 45 } }
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
  const rows = tasks.map((t: any) => [t.taskId, t.taskName, t.frequency?.toUpperCase() || "—", t.taskDetail || "—"]);
  autoTable(doc, { ...tableDefaults(startY, meta), head: [["ID", "TASK NAME", "FREQUENCY", "DETAILS"]], body: rows });
  drawSignatures(doc, (doc as any).lastAutoTable.finalY + 10);
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }
  doc.save(`KR_Steel_Tasks_${equipment.code}_${format(new Date(), "yyyyMMdd")}.pdf`);
}
