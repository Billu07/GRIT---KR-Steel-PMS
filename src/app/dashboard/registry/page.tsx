"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EquipmentModal from "@/components/EquipmentModal";
import { Search, Plus, MapPin, Tag, Edit } from "lucide-react";

export default function RegistryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Modal state
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = () => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setEquipment(data.equipment || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleOpenCreateModal = () => {
    setEditingEquipment(null);
    setIsEquipmentModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenEditModal = (e: React.MouseEvent, eq: any) => {
    e.stopPropagation(); // Prevent card click (navigation)
    setEditingEquipment(eq);
    setIsEquipmentModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveEquipment = async (data: any) => {
    try {
      if (editingEquipment) {
        // UPDATE
        const res = await fetch(`/api/equipment/detail/${editingEquipment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          alert("Equipment updated successfully!");
          fetchEquipment();
          setIsEquipmentModalOpen(false);
          setEditingEquipment(null);
        } else {
          const err = await res.json();
          alert(err.error || "Failed to update equipment");
        }
      } else {
        // CREATE
        const res = await fetch("/api/equipment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          alert("Equipment created successfully!");
          fetchEquipment();
          setIsEquipmentModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || "Failed to create equipment");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving equipment");
    }
  };

  const categories = Array.from(
    new Map(
      equipment
        .filter((eq) => eq.category)
        .map((eq) => [eq.category.id, eq.category]),
    ).values(),
  );

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.code.toLowerCase().includes(search.toLowerCase()) ||
      (eq.location && eq.location.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === "all" || eq.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" ||
      eq.category?.id?.toString() === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const statusConfig: Record<
    string,
    { color: string; bg: string; border: string; dot: string; label: string }
  > = {
    active: {
      color: "text-emerald-800",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      dot: "bg-emerald-600",
      label: "Active",
    },
    inactive: {
      color: "text-slate-600",
      bg: "bg-slate-100",
      border: "border-slate-200",
      dot: "bg-slate-500",
      label: "Inactive",
    },
    maintenance: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      dot: "bg-amber-500",
      label: "Maintenance",
    },
    retired: {
      color: "text-red-800",
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-600",
      label: "Retired",
    },
  };

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .reg-root {
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .reg-add-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #EAE7DF; background: #1A3A52;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
          white-space: nowrap;
        }
        .reg-add-btn:hover  { background: #1F4460; }
        .reg-add-btn:active { background: #132D40; }

        .reg-search:focus {
          border-color: #1A3A52 !important;
          box-shadow: 0 0 0 3px rgba(26,58,82,0.07) !important;
          outline: none;
        }
        .reg-search::placeholder { color: #B8B0A6; }

        .reg-filter-select {
          padding: 9px 28px 9px 12px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px; font-weight: 500;
          color: #1A3A52; background: #FAFAF8;
          border: 1px solid #D0CBC0; border-radius: 2px;
          outline: none; cursor: pointer;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A8A93' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          transition: border-color 0.15s ease;
        }
        .reg-filter-select:focus { border-color: #1A3A52; outline: none; }
      `}</style>

      <div className="reg-root">
        {/* ── Page header (Original) ── */}
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
                Equipment Registry
              </h1>
              <p
                style={{ fontSize: "13px", color: "#7A8A93", marginTop: "6px" }}
              >
                {filteredEquipment.length} of {equipment.length} items
              </p>
            </div>
            <button
              className="reg-add-btn"
              onClick={handleOpenCreateModal}
            >
              <Plus size={13} />
              Add Equipment
            </button>
          </div>
          <div
            style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }}
          />
        </div>

        {/* ── Search + Filters (Original Style) ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1",
              minWidth: "200px",
              maxWidth: "320px",
            }}
          >
            <Search
              size={13}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#7A8A93",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              className="reg-search"
              placeholder="Search name, code, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
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

          <select
            className="reg-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="reg-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        {/* ── Gallery Grid (New Better Design) ── */}
        {filteredEquipment.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filteredEquipment.map((eq: any) => {
              const status = statusConfig[eq.status] ?? statusConfig.inactive;
              return (
                <div
                  key={eq.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/equipment/${eq.category?.id}/detail/${eq.id}`,
                    )
                  }
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#8FBED6] hover:shadow-lg"
                >
                  {/* Image Section */}
                  <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-100">
                    {eq.imageUrl ? (
                      <img
                        src={eq.imageUrl}
                        alt={eq.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {/* Fallback Placeholder (hidden if image loads) */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-100 ${eq.imageUrl ? 'hidden' : ''}`}>
                      <div className="mb-2 rounded-full bg-slate-200 p-3">
                         <Tag size={24} className="text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        No Image
                      </span>
                    </div>
                     {/* Status Badge Overlay */}
                     <div className="absolute right-3 top-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${status.bg} ${status.color} border ${status.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                     </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A3A52]/60">
                        {eq.code}
                      </span>
                    </div>
                    
                    <h3 className="mb-3 text-lg font-bold leading-tight text-slate-900 group-hover:text-[#1A3A52]">
                      {eq.name}
                    </h3>

                    <div className="mt-auto flex flex-col gap-2">
                      {eq.category && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Tag size={12} className="text-[#8FBED6]" />
                          <span className="font-medium">{eq.category.name}</span>
                        </div>
                      )}
                      {eq.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapPin size={12} className="text-[#8FBED6]" />
                          <span>{eq.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 transition-colors group-hover:bg-[#EAF1F6]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A3A52]">
                      View Details
                    </span>
                    <button 
                      onClick={(e) => handleOpenEditModal(e, eq)}
                      className="text-slate-400 hover:text-[#1A3A52] transition-colors p-1"
                      title="Edit Equipment"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="reg-empty" style={{
            gridColumn: "1 / -1",
            padding: "72px 24px",
            textAlign: "center",
            color: "#7A8A93",
            fontSize: "13px",
            letterSpacing: "0.04em",
          }}>
            No equipment found matching your search.
          </div>
        )}
      </div>

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        onSubmit={handleSaveEquipment}
        categoryId={null} // Can be null if we are creating new or editing (category comes from initialData)
        initialData={editingEquipment}
      />
    </>
  );
}
