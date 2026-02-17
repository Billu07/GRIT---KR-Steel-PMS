"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

/*
  Design tokens — mirrors LoginPage.tsx exactly
  --navy:        #1A3A52
  --navy-dark:   #132D40
  --paste:       #EAE7DF
  --paste-light: #F5F3EF
  --white:       #FAFAF8
  --ink:         #1A1A1A
  --muted:       #7A8A93
  --rule:        #D0CBC0
  --accent:      #8FBED6
  --error:       #8B2020
  --amber:       #C4873A
  --green:       #4A7C5A
*/

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

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: "13px",
          color: "#7A8A93",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Loading...
      </div>
    );
  }

  const stats = [
    {
      title: "Jobs Today",
      value: data.stats.jobsToday,
      accent: "#1A3A52",
      light: "#EAF1F6",
    },
    {
      title: "Jobs This Month",
      value: data.stats.jobsThisMonth,
      accent: "#8FBED6",
      light: "#EBF4FA",
    },
    {
      title: "Due Jobs",
      value: data.stats.dueJobs,
      accent: "#C4873A",
      light: "#FAF3E8",
    },
    {
      title: "Overdue Jobs",
      value: data.stats.overdueJobs,
      accent: "#8B2020",
      light: "#F9ECEC",
    },
  ];

  const criticalityConfig: Record<
    string,
    { color: string; bg: string; border: string }
  > = {
    high: {
      color: "#8B2020",
      bg: "rgba(139,32,32,0.07)",
      border: "rgba(139,32,32,0.2)",
    },
    medium: {
      color: "#8B5A00",
      bg: "rgba(196,135,58,0.10)",
      border: "rgba(196,135,58,0.25)",
    },
    low: {
      color: "#2D6A42",
      bg: "rgba(74,124,90,0.08)",
      border: "rgba(74,124,90,0.2)",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .db-root {
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .db-stat {
          background: #FAFAF8;
          border: 1px solid #D0CBC0;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.18s ease, transform 0.18s ease;
        }

        .db-stat:hover {
          box-shadow: 0 4px 18px rgba(26,58,82,0.10);
          transform: translateY(-1px);
        }

        .db-tbody tr { transition: background 0.12s ease; }
        .db-tbody tr:hover td { background: #EAF1F6; }

        .db-table-wrap::-webkit-scrollbar { height: 4px; }
        .db-table-wrap::-webkit-scrollbar-track { background: #EAE7DF; }
        .db-table-wrap::-webkit-scrollbar-thumb { background: #8FBED6; border-radius: 2px; }
      `}</style>

      <div className="db-root">
        {/* Page header */}
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#4A6A7A",
              marginBottom: "8px",
            }}
          >
            KR Steel · Ship Recycling Facility
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#1A3A52",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Dashboard
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.04em",
                color: "#7A8A93",
              }}
            >
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div
            style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }}
          />
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="db-stat">
              <div style={{ height: "4px", background: stat.accent }} />
              <div style={{ padding: "22px 24px 24px" }}>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#7A8A93",
                    marginBottom: "16px",
                  }}
                >
                  {stat.title}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                  }}
                >
                  <p
                    style={{
                      fontSize: "42px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {stat.value}
                  </p>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: stat.light,
                      border: `1px solid ${stat.accent}40`,
                      borderRadius: "2px",
                      flexShrink: 0,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0" }}>
          {/* Section header — navy bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1px solid #D0CBC0",
              background: "#1A3A52",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#EAE7DF",
                margin: 0,
              }}
            >
              Recent Jobs
            </p>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "rgba(234,231,223,0.45)",
                margin: 0,
              }}
            >
              {data.recentJobs.length} records
            </p>
          </div>

          {/* Table */}
          <div className="db-table-wrap" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ background: "#EAE7DF" }}>
                  {[
                    "Job Code",
                    "Job Name",
                    "Equipment",
                    "Criticality",
                    "Due Date",
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "11px 24px",
                        textAlign: "left",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "#1A3A52",
                        whiteSpace: "nowrap",
                        borderBottom: "1px solid #D0CBC0",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="db-tbody">
                {data.recentJobs.length > 0 ? (
                  data.recentJobs.map((job: any) => {
                    const crit =
                      criticalityConfig[job.criticality] ??
                      criticalityConfig.low;
                    return (
                      <tr key={job.id}>
                        <td
                          style={{
                            padding: "14px 24px",
                            whiteSpace: "nowrap",
                            fontWeight: 600,
                            color: "#1A3A52",
                            borderBottom: "1px solid #EAE7DF",
                            letterSpacing: "0.04em",
                            fontSize: "12px",
                          }}
                        >
                          {job.jobCode}
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            whiteSpace: "nowrap",
                            color: "#1A1A1A",
                            borderBottom: "1px solid #EAE7DF",
                          }}
                        >
                          {job.jobName}
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            whiteSpace: "nowrap",
                            color: "#5A6A73",
                            borderBottom: "1px solid #EAE7DF",
                          }}
                        >
                          {job.equipment?.name || "—"}
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            whiteSpace: "nowrap",
                            borderBottom: "1px solid #EAE7DF",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              fontSize: "10px",
                              fontWeight: 600,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              borderRadius: "2px",
                              color: crit.color,
                              background: crit.bg,
                              border: `1px solid ${crit.border}`,
                            }}
                          >
                            {job.criticality}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            whiteSpace: "nowrap",
                            color: "#5A6A73",
                            borderBottom: "1px solid #EAE7DF",
                            fontWeight: 500,
                          }}
                        >
                          {new Date(job.dateDue).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "48px 24px",
                        textAlign: "center",
                        fontSize: "12px",
                        letterSpacing: "0.06em",
                        color: "#7A8A93",
                      }}
                    >
                      No recent jobs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
