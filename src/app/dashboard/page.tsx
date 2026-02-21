"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import LogMaintenanceModal from "@/components/LogMaintenanceModal";
import TaskModal from "@/components/TaskModal";

export default function DashboardPage() {
  const [data, setData] = useState({
    stats: {
      logsToday: 0,
      logsThisMonth: 0,
      scheduledTasks: 0,
      totalAssets: 0,
      inventoryItems: 0,
      correctiveLogs: 0,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentLogs: [] as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeTasks: [] as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    equipment: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddLog = async (logData: any) => {
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (res.ok) {
        setIsLogModalOpen(false);
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add log");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding log");
    }
  };

  const handleAddTask = async (taskData: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        setIsTaskModalOpen(false);
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add task");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding task");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#225CA3] border-t-transparent" />
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#7A8A93] uppercase">
            Loading Facility Records...
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Assets",
      value: data.stats.totalAssets,
      accent: "#225CA3",
      link: "/dashboard/registry",
    },
    {
      title: "Shipyard Inventory",
      value: data.stats.inventoryItems,
      accent: "#1CA5CE",
      link: "/dashboard/inventory",
    },
    {
      title: "Scheduled Tasks",
      value: data.stats.scheduledTasks,
      accent: "#C4873A",
      link: "/dashboard/tasks",
    },
    {
      title: "Total Breakdowns",
      value: data.stats.correctiveLogs,
      accent: "#8B2020",
      link: "/dashboard/maintenance",
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#FAFAF8] text-slate-900 font-sans antialiased pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .glass-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
            border-color: #225CA3;
        }
      `}</style>

      {/* ── Dashboard Header ── */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-0.5 w-6 bg-[#225CA3]" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                KR Ship Recycling Facility
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Operations Overview
            </h1>
          </div>
          <div className="sm:text-right">
            <p className="text-[13px] font-medium text-slate-600 mb-0.5">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="text-[10px] font-bold tracking-widest text-[#2D6A42] uppercase">
              Live System Data
            </p>
          </div>
        </div>
      </div>

      {/* ── Global Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {stats.map((stat, i) => (
          <Link
            href={stat.link}
            key={i}
            className="glass-card p-6 rounded-sm relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ background: stat.accent }}
            />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              {stat.title}
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-slate-900">
                {stat.value}
              </h2>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main Command Split View ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        {/* Left Col: Recent Activity (60%) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase text-[15px]">
              Recent Operational Events
            </h3>
            <Link
              href="/dashboard/maintenance"
              className="text-[10px] font-bold text-[#225CA3] uppercase tracking-widest hover:underline"
            >
              View Full Logs
            </Link>
          </div>

          <div className="glass-card rounded-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Asset Identity
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Event Type
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">
                      Performed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentLogs.map((log: any) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {log.equipment?.name}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                            {log.equipment?.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-tight ${log.type === "corrective" ? "text-red-700" : "text-emerald-700"}`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-xs font-bold text-slate-600">
                          {format(new Date(log.performedAt), "dd MMM yyyy")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Active Scheduled Tasks (40%) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase text-[15px]">
              Active Scheduled Tasks
            </h3>
            <Link
              href="/dashboard/tasks"
              className="text-[10px] font-bold text-[#C4873A] uppercase tracking-widest hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {data.activeTasks.length > 0 ? (
              data.activeTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="glass-card p-5 rounded-sm flex items-center justify-between group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate mb-1">
                      {task.taskName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {task.equipment?.code}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-[#1CA5CE] uppercase">
                        {task.frequency}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-4 border-l border-slate-100">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      {task.taskId}
                    </span>
                    <div className="mt-2 h-0.5 w-10 bg-[#C4873A]" />
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-12 text-center rounded-sm">
                <p className="text-xs text-slate-400 font-medium">
                  No active tasks assigned.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="px-2">
              <h4 className="text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                Quick Actions
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center justify-center px-4 py-4 bg-[#225CA3] text-white rounded-sm text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm hover:bg-[#1B4A82] transition-colors border border-transparent"
              >
                New Maintenance Log
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center justify-center px-4 py-4 bg-white border border-[#225CA3] text-[#225CA3] rounded-sm text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm hover:bg-[#F8FAFC] transition-colors"
              >
                New Scheduled Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <LogMaintenanceModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSubmit={handleAddLog}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleAddTask}
        categoryId={null}
        equipmentList={data.equipment}
      />
    </div>
  );
}
