"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, Download, Save, X, Filter } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function EquipmentDetailPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const equipmentId = params.equipmentId as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equipment, setEquipment] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI State
  const [isAdding, setIsAdding] = useState(false);
  const [filterCriticality, setFilterCriticality] = useState("All");

  // Inline Form State
  const [newJob, setNewJob] = useState({
    jobCode: "",
    jobName: "",
    jobType: "Maintenance",
    flag: "",
    dateDone: format(new Date(), "yyyy-MM-dd"),
    hoursWorked: 0,
    plannedHours: 0,
    frequency: "weekly",
    criticality: "medium",
  });

  // Calculated Preview State for Inline Form
  const [calculated, setCalculated] = useState({
    dateDue: "",
    remainingHours: 0,
    overdueDays: 0,
  });

  // Frequency Map
  const frequencyDays: { [key: string]: number } = {
    weekly: 7,
    monthly: 30,
    "3-monthly": 90,
    yearly: 365,
    "5-yearly": 1825,
  };

  useEffect(() => {
    if (categoryId && equipmentId) {
      fetch(`/api/equipment/${categoryId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const foundEq = data.equipment.find(
              (e: any) => e.id.toString() === equipmentId,
            );
            setEquipment(foundEq);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eqJobs = data.jobs.filter(
              (j: any) => j.equipmentId.toString() === equipmentId,
            );
            setJobs(eqJobs);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [categoryId, equipmentId]);

  // Auto-calculate effect for inline form
  useEffect(() => {
    const daysToAdd = frequencyDays[newJob.frequency] || 0;
    const dateDone = new Date(newJob.dateDone);
    const dueDate = addDays(dateDone, daysToAdd);

    const today = new Date();
    const overdue = differenceInDays(today, dueDate);
    const overdueDays = overdue > 0 ? overdue : 0;
    const remaining = Math.max(0, newJob.plannedHours - newJob.hoursWorked);

    setCalculated({
      dateDue: format(dueDate, "yyyy-MM-dd"),
      overdueDays,
      remainingHours: remaining,
    });
  }, [
    newJob.dateDone,
    newJob.frequency,
    newJob.plannedHours,
    newJob.hoursWorked,
  ]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        filterCriticality === "All" ||
        job.criticality === filterCriticality.toLowerCase(),
    );
  }, [jobs, filterCriticality]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewJob((prev) => ({
      ...prev,
      [name]:
        name.includes("Hours") || name === "hoursWorked"
          ? Number(value)
          : value,
    }));
  };

  const handleSaveJob = async () => {
    try {
      const payload = {
        ...newJob,
        equipmentId,
        dateDue: calculated.dateDue,
        remainingHours: calculated.remainingHours,
        overdueDays: calculated.overdueDays,
      };

      const res = await fetch(`/api/equipment/${categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdJob = await res.json();
        const jobWithDetails = { ...createdJob, equipment: equipment };
        setJobs((prev) => [jobWithDetails, ...prev]);
        setIsAdding(false);
        // Reset form
        setNewJob({
          jobCode: "",
          jobName: "",
          jobType: "Maintenance",
          flag: "",
          dateDone: format(new Date(), "yyyy-MM-dd"),
          hoursWorked: 0,
          plannedHours: 0,
          frequency: "weekly",
          criticality: "medium",
        });
      } else {
        alert("Failed to save job");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving job");
    }
  };

  const exportJobsPDF = () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape for many columns
    doc.setFontSize(18);
    doc.text(`Job History: ${equipment?.name} (${equipment?.code})`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd")}`, 14, 28);

    const tableData = filteredJobs.map((job) => [
      job.jobCode,
      job.jobName,
      job.jobType,
      job.flag,
      format(new Date(job.dateDone), "yyyy-MM-dd"),
      job.hoursWorked,
      job.plannedHours,
      job.remainingHours,
      format(new Date(job.dateDue), "yyyy-MM-dd"),
      job.criticality,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [
        [
          "Code",
          "Name",
          "Type",
          "Flag",
          "Done",
          "Wrk",
          "Pln",
          "Rem",
          "Due",
          "Crit",
        ],
      ],
      body: tableData,
    });

    doc.save(`${equipment?.code}_jobs.pdf`);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!equipment) return <div className="p-8">Equipment not found.</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{equipment.name}</h1>
          <p className="text-sm text-gray-500">
            {equipment.code} &bull; {equipment.location}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button
            onClick={exportJobsPDF}
            variant="secondary"
            className="flex items-center"
          >
            <Download size={18} className="mr-2" />
            Export
          </Button>
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              className="flex items-center"
            >
              <Plus size={18} className="mr-2" />
              New Job
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-500" />
          <span className="font-bold text-gray-700 text-sm">
            FILTER BY CRITICALITY:
          </span>
          <select
            className="border border-gray-300 rounded-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 p-1 text-sm bg-white"
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
          >
            <option value="All">All Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </Card>

      {/* Full Table */}
      <Card className="border border-gray-200 shadow-none overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Job Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                  Job Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Flag
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                  Criticality
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Date Done
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Due Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                  Hours
                  <br />
                  Worked
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                  Planned
                  <br />
                  Hours
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                  Hours
                  <br />
                  Left
                </th>
                {isAdding && (
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {/* INLINE ROW for Adding */}
              {isAdding && (
                <tr className="bg-blue-50 border-b border-blue-200">
                  <td className="px-2 py-2">
                    <input
                      name="jobCode"
                      value={newJob.jobCode}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm"
                      placeholder="Code"
                      autoFocus
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      name="jobName"
                      value={newJob.jobName}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm"
                      placeholder="Job Name"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="jobType"
                      value={newJob.jobType}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm"
                    >
                      <option>Maintenance</option>
                      <option>Inspection</option>
                      <option>Repair</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      name="flag"
                      value={newJob.flag}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm"
                      placeholder="Flag"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="criticality"
                      value={newJob.criticality}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Med</option>
                      <option value="high">High</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="frequency"
                      value={newJob.frequency}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="3-monthly">3-Mon</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      name="dateDone"
                      value={newJob.dateDone}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-medium">
                    {calculated.dateDue}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      name="hoursWorked"
                      value={newJob.hoursWorked}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm text-center"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      name="plannedHours"
                      value={newJob.plannedHours}
                      onChange={handleInputChange}
                      className="w-full p-1 text-sm border border-blue-300 rounded shadow-sm text-center"
                    />
                  </td>
                  <td className="px-2 py-2 font-bold text-gray-500 text-center">
                    {calculated.remainingHours}
                  </td>
                  <td className="px-2 py-2 flex justify-center space-x-2">
                    <button
                      onClick={handleSaveJob}
                      className="p-1 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              )}

              {/* EXISTING JOBS */}
              {filteredJobs.length > 0
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  filteredJobs.map((job: any) => (
                    <tr
                      key={job.id}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {job.jobCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {job.jobName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {job.jobType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {job.flag}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-4 font-bold uppercase tracking-wide rounded-sm 
                        ${
                          job.criticality === "high"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : job.criticality === "medium"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                        >
                          {job.criticality}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {job.frequency}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(new Date(job.dateDone), "yyyy-MM-dd")}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-bold ${job.overdueDays > 0 ? "text-red-600" : "text-gray-600"}`}
                      >
                        {format(new Date(job.dateDue), "yyyy-MM-dd")}
                        {job.overdueDays > 0 && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-1 rounded border border-red-200">
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {job.hoursWorked}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {job.plannedHours}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {job.remainingHours}
                      </td>
                      {isAdding && <td></td>}
                    </tr>
                  ))
                : !isAdding && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <p className="mb-2 font-medium">
                            No jobs found for this equipment.
                          </p>
                          <p className="text-xs">
                            Click "New Job" above to add a maintenance record.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
