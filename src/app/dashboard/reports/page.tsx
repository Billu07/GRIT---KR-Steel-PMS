"use client";

import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { exportJobReportPdf, exportEquipmentReportPdf } from "@/lib/pdfExport";
import { exportMaintenanceExcel } from "@/lib/excelExport";

export default function ReportsBuilderPage() {
  const [loading, setLoading] = useState(false);

  const [reportType, setReportType] = useState("jobs");
  const [groupBy, setGroupBy] = useState("category");
  
  // Job filters
  const [filterCriticality, setFilterCriticality] = useState("all");
  const [filterOverdue, setFilterOverdue] = useState(false);

  // Maintenance filters
  const [maintenanceType, setMaintenanceType] = useState("corrective");
  
  const [durationFilterType, setDurationFilterType] = useState("none");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [allEquipments, setAllEquipments] = useState<any[]>([]);

  // Fetch data on mount to populate equipment list
  React.useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.equipment) {
          setAllEquipments(data.equipment);
        }
      })
      .catch(console.error);
  }, []);

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

  const handleEquipmentToggle = (id: string) => {
    setSelectedEquipments((prev) => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const generateReport = async () => {
    const data = await fetchData();
    if (!data) return;

    const { jobs, equipment, maintenanceHistory } = data;

    if (reportType === "jobs") {
      exportJobReportPdf({
        jobs,
        equipment,
        groupBy,
        filterCriticality,
        filterOverdue,
      });
    } else if (reportType === "equipment") {
      exportEquipmentReportPdf({ equipment, groupBy });
    } else if (reportType === "maintenance") {
      if (!maintenanceHistory) return;
      
      let filteredData = maintenanceHistory;

      // Filter by Maintenance Type
      if (maintenanceType === "corrective") {
        filteredData = filteredData.filter((m: any) => m.type === "corrective");
      } else {
        filteredData = filteredData.filter((m: any) => m.type === "scheduled" || m.type === "predictive");
      }

      // Filter by Equipment
      if (selectedEquipments.length > 0) {
        filteredData = filteredData.filter((m: any) => selectedEquipments.includes(String(m.equipmentId)));
      }

      // Filter by Duration
      if (durationFilterType !== "none") {
        filteredData = filteredData.filter((m: any) => {
          if (!m.performedAt) return false;
          const performedDate = new Date(m.performedAt);
          
          if (durationFilterType === "range" && fromDate && toDate) {
            return performedDate >= new Date(fromDate) && performedDate <= new Date(toDate);
          }
          if (durationFilterType === "date" && singleDate) {
            return performedDate.toISOString().split("T")[0] === singleDate;
          }
          if (durationFilterType === "month" && month) {
            const [y, mStr] = month.split("-");
            return performedDate.getFullYear() === parseInt(y) && performedDate.getMonth() + 1 === parseInt(mStr);
          }
          if (durationFilterType === "year" && year) {
            return performedDate.getFullYear() === parseInt(year);
          }
          return true;
        });
      }

      exportMaintenanceExcel(filteredData, maintenanceType as 'corrective' | 'preventive', `KR_Steel_${maintenanceType}_Maintenance`);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    fontSize: "13px",
    fontWeight: 400,
    color: "#1A1A1A",
    background: "#FAFAF8",
    border: "1px solid #D0CBC0",
    borderRadius: "2px",
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.15s ease",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A8A93' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "32px",
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    backgroundImage: "none",
    paddingRight: "12px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#1A3A52",
    opacity: 0.7,
    marginBottom: "8px",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .rpt-root {
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .rpt-select:focus, .rpt-input:focus { border-color: #1A3A52 !important; box-shadow: 0 0 0 3px rgba(26,58,82,0.07); }

        .rpt-checkbox {
          width: 15px; height: 15px;
          accent-color: #1A3A52;
          cursor: pointer;
          flex-shrink: 0;
        }

        .rpt-generate-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #EAE7DF; background: #1A3A52;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
        }
        .rpt-generate-btn:hover:not(:disabled)  { background: #1F4460; }
        .rpt-generate-btn:active:not(:disabled) { background: #132D40; }
        .rpt-generate-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .rpt-preview-chip {
          background: #FAFAF8;
          border: 1px solid #D0CBC0;
          padding: 16px 20px;
        }
          
        .equipment-list {
          max-height: 150px;
          overflow-y: auto;
          background: #FAFAF8;
          border: 1px solid #D0CBC0;
          border-radius: 2px;
          padding: 8px;
        }
      `}</style>

      <div className="rpt-root">
        {/* ── Page header ── */}
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
            Report Builder
          </h1>
          <p style={{ fontSize: "13px", color: "#7A8A93", marginTop: "6px" }}>
            Configure and generate custom PDF and Excel reports.
          </p>
          <div
            style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ── Config panel ── */}
          <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0" }}>
            {/* Panel header */}
            <div
              style={{
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
                Configuration
              </p>
            </div>

            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* Report type */}
              <div>
                <label style={labelStyle}>1 · Report Type</label>
                <select
                  className="rpt-select"
                  style={selectStyle}
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="jobs">Job History</option>
                  <option value="equipment">Equipment Registry</option>
                  <option value="maintenance">Maintenance Reports</option>
                </select>
              </div>

              {/* Maintenance Specific Options */}
              {reportType === "maintenance" && (
                <>
                  <div>
                    <label style={labelStyle}>Maintenance Type</label>
                    <select
                      className="rpt-select"
                      style={selectStyle}
                      value={maintenanceType}
                      onChange={(e) => setMaintenanceType(e.target.value)}
                    >
                      <option value="preventive">Preventive (Scheduled/Predictive)</option>
                      <option value="corrective">Corrective</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Duration Filter</label>
                    <select
                      className="rpt-select"
                      style={{...selectStyle, marginBottom: "10px"}}
                      value={durationFilterType}
                      onChange={(e) => setDurationFilterType(e.target.value)}
                    >
                      <option value="none">All Time</option>
                      <option value="range">Date Range</option>
                      <option value="date">Specific Date</option>
                      <option value="month">Specific Month</option>
                      <option value="year">Specific Year</option>
                    </select>

                    {durationFilterType === "range" && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <input type="date" className="rpt-input" style={inputStyle} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                        <input type="date" className="rpt-input" style={inputStyle} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    )}
                    {durationFilterType === "date" && (
                      <div style={{ marginTop: "8px" }}>
                        <input type="date" className="rpt-input" style={inputStyle} value={singleDate} onChange={(e) => setSingleDate(e.target.value)} />
                      </div>
                    )}
                    {durationFilterType === "month" && (
                      <div style={{ marginTop: "8px" }}>
                        <input type="month" className="rpt-input" style={inputStyle} value={month} onChange={(e) => setMonth(e.target.value)} />
                      </div>
                    )}
                    {durationFilterType === "year" && (
                      <div style={{ marginTop: "8px" }}>
                        <input type="number" min="1990" max="2100" placeholder="YYYY" className="rpt-input" style={inputStyle} value={year} onChange={(e) => setYear(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Filter by Equipment</label>
                    <div className="equipment-list">
                      {allEquipments.map((eq) => (
                        <div key={eq.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                          <input
                            type="checkbox"
                            id={`eq-${eq.id}`}
                            className="rpt-checkbox"
                            checked={selectedEquipments.includes(String(eq.id))}
                            onChange={() => handleEquipmentToggle(String(eq.id))}
                          />
                          <label htmlFor={`eq-${eq.id}`} style={{ fontSize: "12px", cursor: "pointer" }}>
                            {eq.name} ({eq.code})
                          </label>
                        </div>
                      ))}
                      {allEquipments.length === 0 && (
                        <p style={{ fontSize: "12px", color: "#7A8A93", fontStyle: "italic" }}>Loading equipment...</p>
                      )}
                    </div>
                    <p style={{ fontSize: "11px", color: "#7A8A93", marginTop: "4px" }}>Select one or more. Leave empty for all.</p>
                  </div>
                </>
              )}

              {/* Group by (Not for maintenance) */}
              {reportType !== "maintenance" && (
                <div>
                  <label style={labelStyle}>2 · Group By</label>
                  <select
                    className="rpt-select"
                    style={selectStyle}
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                  >
                    <option value="none">No Grouping (Flat List)</option>
                    <option value="category">Category</option>
                    {reportType === "jobs" && (
                      <option value="equipment">Equipment</option>
                    )}
                  </select>
                </div>
              )}

              {/* Filters — jobs only */}
              {reportType === "jobs" && (
                <div>
                  <label style={labelStyle}>3 · Filters</label>
                  <div
                    style={{
                      padding: "16px",
                      background: "#F0EDE6",
                      border: "1px solid #D0CBC0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "#7A8A93",
                          marginBottom: "8px",
                        }}
                      >
                        Criticality
                      </p>
                      <select
                        className="rpt-select"
                        style={{
                          ...selectStyle,
                          fontSize: "12px",
                          padding: "8px 32px 8px 12px",
                        }}
                        value={filterCriticality}
                        onChange={(e) => setFilterCriticality(e.target.value)}
                      >
                        <option value="all">All Levels</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="overdue"
                        className="rpt-checkbox"
                        checked={filterOverdue}
                        onChange={(e) => setFilterOverdue(e.target.checked)}
                      />
                      <label
                        htmlFor="overdue"
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#1A1A1A",
                          cursor: "pointer",
                        }}
                      >
                        Overdue jobs only
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: "1px", background: "#D0CBC0" }} />

              {/* Generate button */}
              <button
                className="rpt-generate-btn"
                onClick={generateReport}
                disabled={loading}
              >
                {reportType === "maintenance" ? <FileSpreadsheet size={13} /> : <Download size={13} />}
                {loading ? "Generating…" : reportType === "maintenance" ? "Download Excel Report" : "Download PDF Report"}
              </button>
            </div>
          </div>

          {/* ── Preview panel ── */}
          <div
            style={{
              background: "#F5F3EF",
              border: "1px solid #D0CBC0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "64px 48px",
              minHeight: "400px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "#FAFAF8",
                border: "1px solid #D0CBC0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              {reportType === "maintenance" ? (
                <FileSpreadsheet size={24} style={{ color: "#2D6A42" }} />
              ) : (
                <FileText size={24} style={{ color: "#8FBED6" }} />
              )}
            </div>

            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1A3A52",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Ready to Generate
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#7A8A93",
                maxWidth: "320px",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Configure your parameters on the left, then download a {reportType === "maintenance" ? "spreadsheet" : "PDF"} report
              tailored to your needs.
            </p>

            {/* Summary chips */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "36px",
                width: "100%",
                maxWidth: "360px",
              }}
            >
              <div className="rpt-preview-chip" style={{ textAlign: "left" }}>
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#7A8A93",
                    marginBottom: "6px",
                  }}
                >
                  Scope
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1A3A52",
                    textTransform: "capitalize",
                    margin: 0,
                  }}
                >
                  {reportType}
                </p>
              </div>
              
              {reportType === "maintenance" && (
                <div className="rpt-preview-chip" style={{ textAlign: "left" }}>
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#7A8A93",
                      marginBottom: "6px",
                    }}
                  >
                    Maintenance Type
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#1A3A52",
                      textTransform: "capitalize",
                      margin: 0,
                    }}
                  >
                    {maintenanceType}
                  </p>
                </div>
              )}

              {reportType !== "maintenance" && (
                <div className="rpt-preview-chip" style={{ textAlign: "left" }}>
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#7A8A93",
                      marginBottom: "6px",
                    }}
                  >
                    Grouping
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#1A3A52",
                      textTransform: "capitalize",
                      margin: 0,
                    }}
                  >
                    {groupBy}
                  </p>
                </div>
              )}

              {reportType === "jobs" && (
                <>
                  <div
                    className="rpt-preview-chip"
                    style={{ textAlign: "left" }}
                  >
                    <p
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#7A8A93",
                        marginBottom: "6px",
                      }}
                    >
                      Criticality
                    </p>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#1A3A52",
                        textTransform: "capitalize",
                        margin: 0,
                      }}
                    >
                      {filterCriticality === "all" ? "All" : filterCriticality}
                    </p>
                  </div>
                  <div
                    className="rpt-preview-chip"
                    style={{ textAlign: "left" }}
                  >
                    <p
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#7A8A93",
                        marginBottom: "6px",
                      }}
                    >
                      Overdue Only
                    </p>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: filterOverdue ? "#8B2020" : "#1A3A52",
                        margin: 0,
                      }}
                    >
                      {filterOverdue ? "Yes" : "No"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
