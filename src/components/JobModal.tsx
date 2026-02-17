"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { addDays, format, differenceInDays } from "date-fns";

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (jobData: any) => void;
  categoryId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipmentList: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any; // For editing
}

const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipmentList,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    jobCode: "",
    jobName: "",
    jobType: "",
    equipmentId: "",
    flag: "",
    dateDone: format(new Date(), "yyyy-MM-dd"),
    hoursWorked: 0,
    plannedHours: 0,
    frequency: "weekly",
    criticality: "medium",
    status: "active",
  });

  const [calculated, setCalculated] = useState({
    dateDue: "",
    remainingHours: 0,
    overdueDays: 0,
  });

  const frequencyDays: { [key: string]: number } = {
    weekly: 7,
    monthly: 30,
    "3-monthly": 90,
    yearly: 365,
    "5-yearly": 1825,
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        jobCode: initialData.jobCode || "",
        jobName: initialData.jobName || "",
        jobType: initialData.jobType || "",
        equipmentId: initialData.equipmentId ? initialData.equipmentId.toString() : "",
        flag: initialData.flag || "",
        dateDone: initialData.dateDone ? format(new Date(initialData.dateDone), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        hoursWorked: initialData.hoursWorked || 0,
        plannedHours: initialData.plannedHours || 0,
        frequency: initialData.frequency || "weekly",
        criticality: initialData.criticality || "medium",
        status: initialData.status || "active",
      });
    } else {
      setFormData({
        jobCode: "",
        jobName: "",
        jobType: "",
        equipmentId: "",
        flag: "",
        dateDone: format(new Date(), "yyyy-MM-dd"),
        hoursWorked: 0,
        plannedHours: 0,
        frequency: "weekly",
        criticality: "medium",
        status: "active",
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const daysToAdd = frequencyDays[formData.frequency] || 0;
    const dateDone = new Date(formData.dateDone);
    const dueDate = addDays(dateDone, daysToAdd);
    const dateDueStr = format(dueDate, "yyyy-MM-dd");
    const today = new Date();
    const overdue = differenceInDays(today, dueDate);
    const overdueDays = overdue > 0 ? overdue : 0;
    const remaining = Math.max(0, formData.plannedHours - formData.hoursWorked);
    setCalculated({
      dateDue: dateDueStr,
      overdueDays,
      remainingHours: remaining,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.dateDone,
    formData.frequency,
    formData.plannedHours,
    formData.hoursWorked,
  ]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "hoursWorked" || name === "plannedHours"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, ...calculated });
    // Don't auto close here
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    fontSize: "13px",
    color: "#1A1A1A",
    background: "#FAFAF8",
    border: "1px solid #D0CBC0",
    borderRadius: "2px",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const selectStyle: React.CSSProperties = {
    ...fieldStyle,
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A8A93' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "32px",
    cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#1A3A52",
    opacity: 0.7,
    marginBottom: "7px",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .jm-field:focus {
          border-color: #1A3A52 !important;
          box-shadow: 0 0 0 3px rgba(26,58,82,0.07) !important;
        }
        .jm-field::placeholder { color: #C0BAB0; }

        .jm-cancel {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #1A3A52; background: transparent;
          border: 1px solid #D0CBC0; border-radius: 2px;
          cursor: pointer; transition: all 0.15s ease;
        }
        .jm-cancel:hover { border-color: #1A3A52; background: rgba(26,58,82,0.04); }

        .jm-submit {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #EAE7DF; background: #1A3A52;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
        }
        .jm-submit:hover  { background: #1F4460; }
        .jm-submit:active { background: #132D40; }

        @keyframes jm-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(10,20,30,0.55)",
          backdropFilter: "blur(2px)",
          padding: "24px",
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            background: "#FAFAF8",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #D0CBC0",
            fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
            WebkitFontSmoothing: "antialiased",
            animation: "jm-in 0.2s cubic-bezier(0.22,1,0.36,1) both",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              flexShrink: 0,
              background: "#1A3A52",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
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
              {isEditing ? "Edit Job" : "Create New Job"}
            </p>
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                color: "rgba(234,231,223,0.6)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "2px",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EAE7DF")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(234,231,223,0.6)")
              }
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable form body */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>
              {/* Two-column grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px 20px",
                }}
              >
                {/* Left column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Job Code</label>
                    <input
                      type="text"
                      name="jobCode"
                      value={formData.jobCode}
                      onChange={handleChange}
                      required
                      className="jm-field"
                      style={fieldStyle}
                      placeholder="e.g. JB-001"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Job Type</label>
                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className="jm-field"
                      style={selectStyle}
                    >
                      <option value="">Select type</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Repair">Repair</option>
                      <option value="Overhaul">Overhaul</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Equipment</label>
                    <select
                      name="equipmentId"
                      value={formData.equipmentId}
                      onChange={handleChange}
                      required
                      className="jm-field"
                      style={selectStyle}
                    >
                      <option value="">Select equipment</option>
                      {equipmentList.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} ({eq.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Flag</label>
                    <input
                      type="text"
                      name="flag"
                      value={formData.flag}
                      onChange={handleChange}
                      className="jm-field"
                      style={fieldStyle}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Right column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Date Done</label>
                    <input
                      type="date"
                      name="dateDone"
                      value={formData.dateDone}
                      onChange={handleChange}
                      required
                      className="jm-field"
                      style={fieldStyle}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Planned Hrs</label>
                      <input
                        type="number"
                        name="plannedHours"
                        value={formData.plannedHours}
                        onChange={handleChange}
                        required
                        min="0"
                        className="jm-field"
                        style={{ ...fieldStyle, textAlign: "center" }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Hrs Worked</label>
                      <input
                        type="number"
                        name="hoursWorked"
                        value={formData.hoursWorked}
                        onChange={handleChange}
                        min="0"
                        className="jm-field"
                        style={{ ...fieldStyle, textAlign: "center" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Frequency</label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className="jm-field"
                      style={selectStyle}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="3-monthly">3-Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="5-yearly">5-Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Criticality</label>
                    <select
                      name="criticality"
                      value={formData.criticality}
                      onChange={handleChange}
                      className="jm-field"
                      style={selectStyle}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Full-width: Job Name */}
              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "18px",
                  borderTop: "1px solid #EAE7DF",
                }}
              >
                <label style={labelStyle}>Job Name / Description</label>
                <textarea
                  name="jobName"
                  value={formData.jobName}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="jm-field"
                  style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>

              {/* Calculated fields */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                  marginTop: "16px",
                  padding: "16px 20px",
                  background: "#F0EDE6",
                  border: "1px solid #D0CBC0",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#7A8A93",
                      marginBottom: "6px",
                    }}
                  >
                    Due Date
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A3A52",
                      margin: 0,
                    }}
                  >
                    {calculated.dateDue || "—"}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#7A8A93",
                      marginBottom: "6px",
                    }}
                  >
                    Remaining Hours
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A3A52",
                      margin: 0,
                    }}
                  >
                    {calculated.remainingHours}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#7A8A93",
                      marginBottom: "6px",
                    }}
                  >
                    Overdue Days
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      margin: 0,
                      color: calculated.overdueDays > 0 ? "#8B2020" : "#2D6A42",
                    }}
                  >
                    {calculated.overdueDays > 0
                      ? `+${calculated.overdueDays}`
                      : "0"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                padding: "16px 24px",
                flexShrink: 0,
                borderTop: "1px solid #D0CBC0",
                background: "#F5F3EF",
              }}
            >
              <button type="button" className="jm-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="jm-submit">
                {isEditing ? "Save Changes" : "Create Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default JobModal;
