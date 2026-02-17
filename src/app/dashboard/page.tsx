"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

export default function DashboardPage() {
  const [data, setData] = useState({
    stats: {
      jobsToday: 0,
      jobsThisMonth: 0,
      dueJobs: 0,
      overdueJobs: 0,
    },
    recentJobs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  const stats = [
    {
      title: "Jobs Today",
      value: data.stats.jobsToday,
      borderColor: "border-t-blue-600",
    },
    {
      title: "Jobs This Month",
      value: data.stats.jobsThisMonth,
      borderColor: "border-t-blue-400",
    },
    {
      title: "Due Jobs",
      value: data.stats.dueJobs,
      borderColor: "border-t-orange-400",
    },
    {
      title: "Overdue Jobs",
      value: data.stats.overdueJobs,
      borderColor: "border-t-red-600",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-6 rounded-sm shadow-sm bg-white border border-gray-200 border-t-4 ${stat.borderColor}`}
          >
            <div>
              <p className="text-gray-500 uppercase text-xs font-bold tracking-wider">
                {stat.title}
              </p>
              <p className="text-3xl font-extrabold text-gray-800 mt-2">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Card title="Recent Jobs" className="border border-gray-200 shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Job Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Job Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Equipment Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.recentJobs.length > 0 ? (
                data.recentJobs.map((job: any) => (
                  <tr
                    key={job.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {job.jobCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {job.jobName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {job.equipment?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-sm 
                        ${
                          job.criticality === "high"
                            ? "bg-red-100 text-red-800"
                            : job.criticality === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {job.criticality}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {new Date(job.dateDue).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No recent jobs found.
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
