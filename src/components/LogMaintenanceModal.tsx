"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
}

const LogMaintenanceModal: React.FC<LogMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    type: "corrective",
    interventionDate: "",
    serviceStartDate: "",
    serviceEndDate: "",
    problemDescription: "",
    solutionDetails: "",
    usedParts: "",
    workType: "mechanical",
    problemType: "minor",
    remarks: "",
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

        .lm-field:focus {
          border-color: #1A3A52 !important;
          box-shadow: 0 0 0 3px rgba(26,58,82,0.07) !important;
        }

        .lm-cancel {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #1A3A52; background: transparent;
          border: 1px solid #D0CBC0; border-radius: 2px;
          cursor: pointer; transition: all 0.15s ease;
        }
        .lm-cancel:hover { border-color: #1A3A52; background: rgba(26,58,82,0.04); }

        .lm-submit {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #EAE7DF; background: #1A3A52;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
        }
        .lm-submit:hover  { background: #1F4460; }
        .lm-submit:active { background: #132D40; }

        @keyframes lm-in {
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
            animation: "lm-in 0.2s cubic-bezier(0.22,1,0.36,1) both",
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
              Log Maintenance
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

          {/* Form */}
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
              
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Maintenance Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="lm-field"
                  style={selectStyle}
                >
                  <option value="corrective">Corrective (Breakdown/Repair)</option>
                  <option value="predictive">Predictive (Condition Based)</option>
                </select>
              </div>

              {formData.type === 'corrective' && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "14px",
                      marginBottom: "20px"
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Intervention Date</label>
                      <input
                        type="datetime-local"
                        name="interventionDate"
                        value={formData.interventionDate}
                        onChange={handleChange}
                        className="lm-field"
                        style={fieldStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Service Start</label>
                      <input
                        type="datetime-local"
                        name="serviceStartDate"
                        value={formData.serviceStartDate}
                        onChange={handleChange}
                        className="lm-field"
                        style={fieldStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Service End</label>
                      <input
                        type="datetime-local"
                        name="serviceEndDate"
                        value={formData.serviceEndDate}
                        onChange={handleChange}
                        className="lm-field"
                        style={fieldStyle}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "14px",
                      marginBottom: "20px"
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Work Type</label>
                      <select
                        name="workType"
                        value={formData.workType}
                        onChange={handleChange}
                        className="lm-field"
                        style={selectStyle}
                      >
                        <option value="mechanical">Mechanical</option>
                        <option value="electrical">Electrical</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Problem Type</label>
                      <select
                        name="problemType"
                        value={formData.problemType}
                        onChange={handleChange}
                        className="lm-field"
                        style={selectStyle}
                      >
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>Problem Description</label>
                      <textarea
                        name="problemDescription"
                        value={formData.problemDescription}
                        onChange={handleChange}
                        rows={2}
                        className="lm-field"
                        style={{ ...fieldStyle, resize: "vertical" }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Solution Details</label>
                      <textarea
                        name="solutionDetails"
                        value={formData.solutionDetails}
                        onChange={handleChange}
                        rows={2}
                        className="lm-field"
                        style={{ ...fieldStyle, resize: "vertical" }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Used Parts</label>
                      <textarea
                        name="usedParts"
                        value={formData.usedParts}
                        onChange={handleChange}
                        rows={1}
                        className="lm-field"
                        style={{ ...fieldStyle, resize: "vertical" }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Remarks available for both types */}
              <div style={{ marginTop: "14px" }}>
                <label style={labelStyle}>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={2}
                  className="lm-field"
                  style={{ ...fieldStyle, resize: "vertical" }}
                />
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
              <button type="button" className="lm-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="lm-submit">
                Save Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LogMaintenanceModal;