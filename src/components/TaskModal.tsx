"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (taskData: any) => void;
  categoryId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipmentList: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any; // For editing
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipmentList,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    taskId: "",
    taskName: "",
    frequency: "weekly",
    taskDetail: "",
    equipmentId: "",
  });

  useEffect(() => {
    if (isOpen) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
            taskId: initialData?.taskId || "",
            taskName: initialData?.taskName || "",
            frequency: initialData?.frequency || "weekly",
            taskDetail: initialData?.taskDetail || "",
            equipmentId: initialData?.equipmentId ? initialData.equipmentId.toString() : "",
        });
    }
  }, [isOpen, initialData]);

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
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData });
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
    color: "#225CA3",
    opacity: 0.7,
    marginBottom: "7px",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .jm-field:focus {
          border-color: #225CA3 !important;
          box-shadow: 0 0 0 3px rgba(34,92,163,0.07) !important;
        }
        .jm-field::placeholder { color: #C0BAB0; }

        .jm-cancel {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #225CA3; background: transparent;
          border: 1px solid #D0CBC0; border-radius: 2px;
          cursor: pointer; transition: all 0.15s ease;
        }
        .jm-cancel:hover { border-color: #225CA3; background: rgba(34,92,163,0.04); }

        .jm-submit {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #EAE7DF; background: #225CA3;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
        }
        .jm-submit:hover  { background: #1B4A82; }
        .jm-submit:active { background: #133660; }

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
              background: "#225CA3",
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
              {isEditing ? "Edit Task" : "Create New Task"}
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
                    <label style={labelStyle}>Task ID</label>
                    <input
                      type="text"
                      name="taskId"
                      value={formData.taskId}
                      onChange={handleChange}
                      required
                      className="jm-field"
                      style={fieldStyle}
                      placeholder="e.g. TSK-001"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Task Name</label>
                    <input
                      type="text"
                      name="taskName"
                      value={formData.taskName}
                      onChange={handleChange}
                      required
                      className="jm-field"
                      style={fieldStyle}
                      placeholder="e.g. Monthly Inspection"
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
                    <label style={labelStyle}>Frequency</label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className="jm-field"
                      style={selectStyle}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi_annually">Semi-Annually</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Full-width: Task Detail */}
              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "18px",
                  borderTop: "1px solid #EAE7DF",
                }}
              >
                <label style={labelStyle}>Task Detail</label>
                <textarea
                  name="taskDetail"
                  value={formData.taskDetail}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="jm-field"
                  style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.6 }}
                  placeholder="Provide task details here..."
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
              <button type="button" className="jm-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="jm-submit">
                {isEditing ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default TaskModal;
