"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EquipmentModal from "@/components/EquipmentModal";
import { Plus, Search } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [category, setCategory] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (categoryId) {
      fetch(`/api/equipment/${categoryId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error);
          } else {
            setCategory(data.category);
            setEquipment(data.equipment);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [categoryId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateEquipment = async (newEquipment: any) => {
    try {
      const res = await fetch("/api/equipment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEquipment),
      });

      if (res.ok) {
        const createdEq = await res.json();
        // Only add to local state if it belongs to this category
        if (createdEq.categoryId.toString() === categoryId) {
          setEquipment((prev) => [...prev, createdEq]);
        }
        setIsEquipmentModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create equipment");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating equipment");
    }
  };

  const filteredEquipment = equipment.filter(
    (eq) =>
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.code.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
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

  if (!category)
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: "13px",
          color: "#7A8A93",
        }}
      >
        Category not found.
      </div>
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .eq-root {
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .eq-search:focus {
          border-color: #1A3A52 !important;
          box-shadow: 0 0 0 3px rgba(26,58,82,0.07) !important;
          outline: none;
        }

        .eq-tbody tr {
          transition: background 0.12s ease;
          cursor: pointer;
        }

        .eq-tbody tr:hover td {
          background: #EAF1F6;
        }

        .eq-view-link {
          color: #1A3A52;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .eq-view-link:hover {
          color: #8FBED6;
        }

        .eq-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #EAE7DF;
          background: #1A3A52;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.15s ease;
          white-space: nowrap;
        }

        .eq-add-btn:hover { background: #1F4460; }
        .eq-add-btn:active { background: #132D40; }

        .eq-table-wrap::-webkit-scrollbar { height: 4px; }
        .eq-table-wrap::-webkit-scrollbar-track { background: #EAE7DF; }
        .eq-table-wrap::-webkit-scrollbar-thumb { background: #8FBED6; border-radius: 2px; }
      `}</style>

      <div className="eq-root">
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
            KR Steel · Equipment
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
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
                {category.name}
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#7A8A93",
                  marginTop: "6px",
                }}
              >
                {category.description || "Manage equipment in this category"}
              </p>
            </div>
            <button
              className="eq-add-btn"
              onClick={() => setIsEquipmentModalOpen(true)}
            >
              <Plus size={14} />
              Add Equipment
            </button>
          </div>
          <div
            style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }}
          />
        </div>

        {/* ── Search bar ── */}
        <div style={{ marginBottom: "20px", position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7A8A93",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            className="eq-search"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "360px",
              padding: "10px 14px 10px 38px",
              fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
              fontSize: "13px",
              color: "#1A1A1A",
              background: "#FAFAF8",
              border: "1px solid #D0CBC0",
              borderRadius: "2px",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          />
        </div>

        {/* ── Equipment table ── */}
        <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0" }}>
          {/* Section header */}
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
              Equipment List
            </p>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "rgba(234,231,223,0.45)",
                margin: 0,
              }}
            >
              {filteredEquipment.length} records
            </p>
          </div>

          <div className="eq-table-wrap" style={{ overflowX: "auto" }}>
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
                    "Equipment Code",
                    "Equipment Name",
                    "Location",
                    "Status",
                    "Actions",
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
              <tbody className="eq-tbody">
                {filteredEquipment.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  filteredEquipment.map((eq: any) => (
                    <tr
                      key={eq.id}
                      onClick={() =>
                        router.push(
                          `/dashboard/equipment/${categoryId}/detail/${eq.id}`,
                        )
                      }
                    >
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
                        {eq.code}
                      </td>
                      <td
                        style={{
                          padding: "14px 24px",
                          whiteSpace: "nowrap",
                          color: "#1A1A1A",
                          borderBottom: "1px solid #EAE7DF",
                        }}
                      >
                        {eq.name}
                      </td>
                      <td
                        style={{
                          padding: "14px 24px",
                          whiteSpace: "nowrap",
                          color: "#5A6A73",
                          borderBottom: "1px solid #EAE7DF",
                        }}
                      >
                        {eq.location}
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
                            color:
                              eq.status === "active" ? "#2D6A42" : "#5A6A73",
                            background:
                              eq.status === "active"
                                ? "rgba(74,124,90,0.08)"
                                : "rgba(90,106,115,0.08)",
                            border:
                              eq.status === "active"
                                ? "1px solid rgba(74,124,90,0.2)"
                                : "1px solid rgba(90,106,115,0.2)",
                          }}
                        >
                          {eq.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 24px",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid #EAE7DF",
                        }}
                      >
                        <span className="eq-view-link">View Jobs →</span>
                      </td>
                    </tr>
                  ))
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
                      No equipment found. Click "Add Equipment" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        onSubmit={handleCreateEquipment}
        categoryId={parseInt(categoryId)}
      />
    </>
  );
}
