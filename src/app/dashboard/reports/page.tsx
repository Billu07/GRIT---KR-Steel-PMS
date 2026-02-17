"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Download, FileText, Settings, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export default function ReportsBuilderPage() {
  const [loading, setLoading] = useState(false);

  // Builder State
  const [reportType, setReportType] = useState("jobs"); // 'jobs' | 'equipment'
  const [groupBy, setGroupBy] = useState("category"); // 'category' | 'equipment' | 'none'
  const [filterCriticality, setFilterCriticality] = useState("all");
  const [filterOverdue, setFilterOverdue] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return null;
    }
  };

  const generateReport = async () => {
    const data = await fetchData();
    if (!data) return;

    const { jobs, equipment } = data;
    const doc = new jsPDF();
    const title =
      reportType === "jobs"
        ? "Maintenance Job Report"
        : "Equipment Registry Report";

    // Header
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 14, 28);
    doc.text(
      `Filters: Crit=${filterCriticality}, Overdue=${filterOverdue ? "Yes" : "No"}`,
      14,
      33,
    );

    let startY = 40;

    if (reportType === "jobs") {
      // 1. Filter Data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filteredJobs = jobs.filter((job: any) => {
        if (filterOverdue && job.overdueDays <= 0) return false;
        if (
          filterCriticality !== "all" &&
          job.criticality !== filterCriticality
        )
          return false;
        return true;
      });

      // 2. Group Data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const grouped = filteredJobs.reduce((acc: any, job: any) => {
        let key = "All Jobs";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eq = equipment.find((e: any) => e.id === job.equipmentId);

        if (groupBy === "category") {
          key = eq?.category?.name || "Uncategorized";
        } else if (groupBy === "equipment") {
          key = eq ? `${eq.name} (${eq.code})` : "Unknown";
        }

        if (!acc[key]) acc[key] = [];
        acc[key].push(job);
        return acc;
      }, {});

      // 3. Render Tables
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(grouped).forEach(
        ([groupName, groupJobs]: [string, any]) => {
          // Check page break
          if (startY > 250) {
            doc.addPage();
            startY = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(groupName, 14, startY);
          startY += 5;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tableData = groupJobs.map((job: any) => [
            job.jobCode,
            job.jobName,
            format(new Date(job.dateDue), "yyyy-MM-dd"),
            job.criticality,
            job.overdueDays > 0 ? `+${job.overdueDays}` : "OK",
          ]);

          autoTable(doc, {
            startY: startY,
            head: [["Code", "Job Name", "Due Date", "Crit", "Overdue"]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [0, 82, 204] },
            margin: { left: 14, right: 14 },
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          startY = (doc as any).lastAutoTable.finalY + 10;
        },
      );
    } else {
      // EQUIPMENT REPORT
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filteredEq = equipment; // Add filters if needed for equipment

      // Grouping
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const grouped = filteredEq.reduce((acc: any, eq: any) => {
        let key = "All Equipment";
        if (groupBy === "category") {
          key = eq.category?.name || "Uncategorized";
        }
        if (!acc[key]) acc[key] = [];
        acc[key].push(eq);
        return acc;
      }, {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(grouped).forEach(([groupName, groupEq]: [string, any]) => {
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(groupName, 14, startY);
        startY += 5;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableData = groupEq.map((eq: any) => [
          eq.code,
          eq.name,
          eq.location,
          eq.status,
        ]);

        autoTable(doc, {
          startY: startY,
          head: [["Code", "Name", "Location", "Status"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [0, 82, 204] },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        startY = (doc as any).lastAutoTable.finalY + 10;
      });
    }

    doc.save(`report_${reportType}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Report Builder</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure and generate custom PDF reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CONFIG PANEL */}
        <Card className="lg:col-span-1 h-fit border-t-4 border-t-blue-600">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Settings size={20} className="mr-2 text-blue-600" />
              Configuration
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                1. Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 rounded-sm p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="jobs">Job History / Maintenance</option>
                <option value="equipment">Equipment Registry</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                2. Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full border border-gray-300 rounded-sm p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">No Grouping (Flat List)</option>
                <option value="category">Category</option>
                {reportType === "jobs" && (
                  <option value="equipment">Equipment</option>
                )}
              </select>
            </div>

            {reportType === "jobs" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  3. Filters
                </label>
                <div className="space-y-3 p-3 bg-gray-50 rounded-sm border border-gray-200">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Criticality
                    </span>
                    <select
                      value={filterCriticality}
                      onChange={(e) => setFilterCriticality(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-sm p-1 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="overdue"
                      checked={filterOverdue}
                      onChange={(e) => setFilterOverdue(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label
                      htmlFor="overdue"
                      className="ml-2 text-sm text-gray-700 font-medium"
                    >
                      Overdue Jobs Only
                    </label>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={generateReport}
              disabled={loading}
              className="w-full mt-4 flex justify-center items-center py-3 bg-blue-700 hover:bg-blue-800"
            >
              <Download size={18} className="mr-2" />
              {loading ? "Generating..." : "Download PDF Report"}
            </Button>
          </div>
        </Card>

        {/* PREVIEW / INFO PANEL */}
        <Card className="lg:col-span-2 bg-gray-50 border border-gray-200 flex flex-col justify-center items-center text-center p-12 opacity-75">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <FileText size={48} className="text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-400">Ready to Generate</h3>
          <p className="text-gray-500 max-w-sm mt-2">
            Select your parameters on the left to generate a custom PDF report
            tailored to your needs.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left w-full max-w-md">
            <div className="bg-white p-4 rounded-sm border border-gray-200">
              <span className="block text-xs font-bold text-gray-400 uppercase">
                Selected Scope
              </span>
              <span className="text-lg font-bold text-gray-800 capitalize">
                {reportType}
              </span>
            </div>
            <div className="bg-white p-4 rounded-sm border border-gray-200">
              <span className="block text-xs font-bold text-gray-400 uppercase">
                Grouping
              </span>
              <span className="text-lg font-bold text-gray-800 capitalize">
                {groupBy}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
