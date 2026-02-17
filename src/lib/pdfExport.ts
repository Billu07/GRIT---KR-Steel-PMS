/**
 * pdfExport.ts
 * Shared branded PDF export utility for GRIT — KR Steel Ship Recycling Facility
 *
 * Usage:
 *   import { createBrandedDoc, savePdf } from '@/lib/pdfExport';
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// ─── Design tokens (mirrors the app palette) ──────────────────────────────────
const C = {
  navy: [26, 58, 82] as [number, number, number], // #1A3A52
  navyDark: [19, 45, 64] as [number, number, number], // #132D40
  accent: [143, 190, 214] as [number, number, number], // #8FBED6
  paste: [234, 231, 223] as [number, number, number], // #EAE7DF
  pasteLight: [245, 243, 239] as [number, number, number], // #F5F3EF
  rule: [208, 203, 192] as [number, number, number], // #D0CBC0
  ink: [26, 26, 26] as [number, number, number], // #1A1A1A
  muted: [122, 138, 147] as [number, number, number], // #7A8A93
  red: [139, 32, 32] as [number, number, number], // #8B2020
  amber: [196, 135, 58] as [number, number, number], // #C4873A
  green: [45, 106, 66] as [number, number, number], // #2D6A42
  white: [250, 250, 248] as [number, number, number], // #FAFAF8
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfMeta {
  title: string; // e.g. "Maintenance Job Report"
  subtitle?: string; // e.g. "Filtered by: High Criticality · Overdue Only"
  orientation?: "p" | "l";
}

// ─── Header / Footer ──────────────────────────────────────────────────────────

/**
 * Draws the branded page header and returns the Y position to start content.
 */
function drawHeader(doc: jsPDF, meta: PdfMeta): number {
  const pw = doc.internal.pageSize.getWidth();

  // Navy header bar
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pw, 28, "F");

  // Accent rule at bottom of header bar
  doc.setFillColor(...C.accent);
  doc.rect(0, 27, pw, 1, "F");

  // Company name — left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text("KR STEEL", 14, 11);

  // Sub-label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.accent);
  doc.text("SHIP RECYCLING FACILITY", 14, 17);

  // GRIT label — right-aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("GRIT", pw - 14, 11, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.accent);
  doc.text("Gear Reliability & Intervention Tracker", pw - 14, 17, {
    align: "right",
  });

  // Paste background for title area
  doc.setFillColor(...C.pasteLight);
  doc.rect(0, 28, pw, 22, "F");

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.navy);
  doc.text(meta.title.toUpperCase(), 14, 40);

  // Subtitle / filter summary
  if (meta.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text(meta.subtitle, 14, 47);
  }

  // Generation timestamp — right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(
    `Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`,
    pw - 14,
    47,
    { align: "right" },
  );

  // Rule below title area
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.line(14, 50, pw - 14, 50);

  return 57; // content starts here
}

/**
 * Draws page footer with page number.
 */
function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.line(14, ph - 14, pw - 14, ph - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(
    "KR Steel Ship Recycling Facility · GRIT v1.0.0 · Confidential",
    14,
    ph - 8,
  );
  doc.text(`Page ${pageNum} of ${totalPages}`, pw - 14, ph - 8, {
    align: "right",
  });
}

// ─── Section heading ──────────────────────────────────────────────────────────

function drawSectionHeading(doc: jsPDF, label: string, y: number): number {
  const pw = doc.internal.pageSize.getWidth();

  doc.setFillColor(...C.navy);
  doc.rect(14, y, pw - 28, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.white);
  doc.text(label.toUpperCase(), 18, y + 5.5);

  return y + 8;
}

// ─── autoTable defaults ───────────────────────────────────────────────────────

const tableDefaults = (startY: number) => ({
  startY,
  margin: { left: 14, right: 14 },
  styles: {
    font: "helvetica",
    fontSize: 8,
    cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    textColor: C.ink,
    lineColor: C.rule,
    lineWidth: 0.2,
  },
  headStyles: {
    fillColor: C.paste,
    textColor: C.navy,
    fontStyle: "bold" as const,
    fontSize: 7,
    cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
  },
  alternateRowStyles: {
    fillColor: C.pasteLight,
  },
  bodyStyles: {
    fillColor: C.white,
  },
  tableLineColor: C.rule,
  tableLineWidth: 0.2,
});

// ─── Criticality cell color ───────────────────────────────────────────────────

function critColor(crit: string): [number, number, number] {
  if (crit === "high") return C.red;
  if (crit === "medium") return C.amber;
  return C.green;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Export a branded Job Report PDF.
 */
export function exportJobReportPdf({
  jobs,
  equipment,
  groupBy,
  filterCriticality,
  filterOverdue,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipment: any[];
  groupBy: string;
  filterCriticality: string;
  filterOverdue: boolean;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Build subtitle
  const filters: string[] = [];
  if (filterCriticality !== "all")
    filters.push(`Criticality: ${filterCriticality}`);
  if (filterOverdue) filters.push("Overdue jobs only");
  if (groupBy !== "none") filters.push(`Grouped by: ${groupBy}`);

  const meta: PdfMeta = {
    title: "Maintenance Job Report",
    subtitle: filters.length ? filters.join(" · ") : "All jobs",
    orientation: "l",
  };

  let startY = drawHeader(doc, meta);

  // Filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredJobs = jobs.filter((job: any) => {
    if (filterOverdue && job.overdueDays <= 0) return false;
    if (filterCriticality !== "all" && job.criticality !== filterCriticality)
      return false;
    return true;
  });

  // Group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped = filteredJobs.reduce((acc: any, job: any) => {
    let key = "All Jobs";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eq = equipment.find((e: any) => e.id === job.equipmentId);
    if (groupBy === "category") key = eq?.category?.name || "Uncategorized";
    else if (groupBy === "equipment")
      key = eq ? `${eq.name} (${eq.code})` : "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});

  const ph = doc.internal.pageSize.getHeight();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(grouped).forEach(([groupName, groupJobs]: [string, any]) => {
    if (startY > ph - 40) {
      doc.addPage();
      startY = drawHeader(doc, meta);
    }

    startY = drawSectionHeading(doc, groupName, startY) + 2;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = groupJobs.map((job: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eq = equipment.find((e: any) => e.id === job.equipmentId);
      return [
        job.jobCode,
        job.jobName,
        eq?.name || "—",
        job.jobType || "—",
        job.frequency || "—",
        format(new Date(job.dateDone), "dd MMM yyyy"),
        format(new Date(job.dateDue), "dd MMM yyyy"),
        job.hoursWorked,
        job.plannedHours,
        job.remainingHours,
        job.criticality,
        job.overdueDays > 0 ? `+${job.overdueDays}d` : "OK",
      ];
    });

    autoTable(doc, {
      ...tableDefaults(startY),
      head: [
        [
          "Code",
          "Job Name",
          "Equipment",
          "Type",
          "Freq.",
          "Done",
          "Due",
          "Hrs Worked",
          "Planned",
          "Remaining",
          "Crit.",
          "Overdue",
        ],
      ],
      body: rows,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === "body") {
          // Criticality column
          if (data.column.index === 10) {
            data.cell.styles.textColor = critColor(data.cell.raw as string);
            data.cell.styles.fontStyle = "bold";
          }
          // Overdue column
          if (data.column.index === 11) {
            const val = data.cell.raw as string;
            if (val !== "OK") {
              data.cell.styles.textColor = C.red;
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = C.green;
            }
          }
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startY = (doc as any).lastAutoTable.finalY + 10;
  });

  // Footers on all pages
  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(`GRIT_Job_Report_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
}

/**
 * Export a branded Equipment Registry PDF.
 */
export function exportEquipmentReportPdf({
  equipment,
  groupBy,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipment: any[];
  groupBy: string;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const meta: PdfMeta = {
    title: "Equipment Registry Report",
    subtitle: groupBy !== "none" ? `Grouped by: ${groupBy}` : "Full registry",
  };

  let startY = drawHeader(doc, meta);
  const ph = doc.internal.pageSize.getHeight();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped = equipment.reduce((acc: any, eq: any) => {
    const key =
      groupBy === "category"
        ? eq.category?.name || "Uncategorized"
        : "All Equipment";
    if (!acc[key]) acc[key] = [];
    acc[key].push(eq);
    return acc;
  }, {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(grouped).forEach(([groupName, groupEq]: [string, any]) => {
    if (startY > ph - 40) {
      doc.addPage();
      startY = drawHeader(doc, meta);
    }

    startY = drawSectionHeading(doc, groupName, startY) + 2;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = groupEq.map((eq: any) => [
      eq.code,
      eq.name,
      eq.category?.name || "—",
      eq.location || "—",
      eq.status,
      eq.description || "—",
    ]);

    autoTable(doc, {
      ...tableDefaults(startY),
      head: [["Code", "Name", "Category", "Location", "Status", "Description"]],
      body: rows,
      columnStyles: { 5: { cellWidth: 60 } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          const val = (data.cell.raw as string).toLowerCase();
          data.cell.styles.textColor = val === "active" ? C.green : C.muted;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startY = (doc as any).lastAutoTable.finalY + 10;
  });

  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(
    `GRIT_Equipment_Registry_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`,
  );
}

/**
 * Export a branded Job History PDF for a single piece of equipment.
 * Used in EquipmentDetailPage.
 */
export function exportEquipmentJobsPdf({
  equipment,
  jobs,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipment: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs: any[];
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const meta: PdfMeta = {
    title: `Job History — ${equipment.name}`,
    subtitle: `${equipment.code} · ${equipment.location || "—"} · ${jobs.length} record${jobs.length !== 1 ? "s" : ""}`,
    orientation: "l",
  };

  let startY = drawHeader(doc, meta);
  startY =
    drawSectionHeading(doc, `${equipment.name} (${equipment.code})`, startY) +
    2;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = jobs.map((job: any) => [
    job.jobCode,
    job.jobName,
    job.jobType || "—",
    job.flag || "—",
    job.frequency || "—",
    format(new Date(job.dateDone), "dd MMM yyyy"),
    format(new Date(job.dateDue), "dd MMM yyyy"),
    job.hoursWorked,
    job.plannedHours,
    job.remainingHours,
    job.criticality,
    job.overdueDays > 0 ? `+${job.overdueDays}d` : "OK",
  ]);

  autoTable(doc, {
    ...tableDefaults(startY),
    head: [
      [
        "Code",
        "Job Name",
        "Type",
        "Flag",
        "Freq.",
        "Done",
        "Due",
        "Hrs Worked",
        "Planned",
        "Remaining",
        "Crit.",
        "Overdue",
      ],
    ],
    body: rows,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section === "body") {
        if (data.column.index === 10) {
          data.cell.styles.textColor = critColor(data.cell.raw as string);
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 11) {
          const val = data.cell.raw as string;
          data.cell.styles.textColor = val !== "OK" ? C.red : C.green;
          if (val !== "OK") data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  const total = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(
    `GRIT_${equipment.code}_Jobs_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`,
  );
}
