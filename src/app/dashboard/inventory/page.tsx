"use client";

import React, { useEffect, useState } from "react";
import { Search, Package, FileText, Download, Plus, Edit2, Trash2, X } from "lucide-react";
import { exportToExcel } from "@/lib/excelExport";
import { exportToPDF } from "@/lib/pdfExport";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    description: "",
    swl: "",
    certificateNo: ""
  });

  const fetchInventory = () => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => {
        setInventory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Frontend: Error fetching inventory:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", quantity: "", description: "", swl: "", certificateNo: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      quantity: item.quantity || "",
      description: item.description || "",
      swl: item.swl || "",
      certificateNo: item.certificateNo || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchInventory();
      else alert("Failed to delete item");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PATCH" : "POST";
    const body = editingItem ? { id: editingItem.id, ...formData } : formData;

    try {
      const res = await fetch("/api/inventory", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchInventory();
      } else {
        alert("Failed to save item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.certificateNo && item.certificateNo.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const handleDownloadExcel = () => {
    const data = filteredInventory.map((item, idx) => ({
      "SL No.": idx + 1,
      "Name of Equipment": item.name,
      "Quantity": item.quantity || "—",
      "Description": item.description || "—",
      "SWL": item.swl || "—",
      "Certificate Number": item.certificateNo || "—",
    }));
    exportToExcel(data, "Inventory_Report");
  };

  const handleDownloadPDF = () => {
    const headers = [["SL No.", "Name of Equipment", "Quantity", "Description", "SWL", "Certificate Number"]];
    const data = filteredInventory.map((item, idx) => [
      idx + 1,
      item.name,
      item.quantity || "—",
      item.description || "—",
      item.swl || "—",
      item.certificateNo || "—",
    ]);
    exportToPDF("Inventory Summary Report", headers, data, "Inventory_Report");
  };

  if (loading)
    return (
      <div style={{ padding: "40px", fontFamily: "inherit", fontSize: "13px", color: "#7A8A93", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Loading Inventory...
      </div>
    );

  const inputStyle = {
    width: "100%", padding: "10px 12px", fontSize: "13px", color: "#1A1A1A", background: "#FAFAF8", border: "1px solid #D0CBC0", borderRadius: "2px", outline: "none", marginTop: "4px"
  };

  return (
    <>
      <style>{`
        .inv-root { font-family: 'DM Sans', sans-serif; }
        .inv-search:focus { border-color: #225CA3 !important; box-shadow: 0 0 0 3px rgba(34,92,163,0.07) !important; outline: none; }
        .inv-tbody tr { transition: background 0.12s ease; }
        .inv-tbody tr:hover td { background: #EAF1F6; }
        .inv-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; border-radius: 2px; cursor: pointer; transition: all 0.15s ease; border: none; }
        .inv-btn-primary { color: #EAE7DF; background: #225CA3; }
        .inv-btn-primary:hover { background: #1B4A82; }
        .inv-btn-outline { color: #225CA3; background: transparent; border: 1px solid #D0CBC0; }
        .inv-btn-outline:hover { border-color: #225CA3; background: #FAFAF8; }
        .inv-action-btn { background: transparent; border: none; padding: 4px; cursor: pointer; color: #7A8A93; transition: color 0.15s ease; }
        .inv-action-btn:hover { color: #225CA3; }
        .inv-action-btn-del:hover { color: #8B2020; }
      `}</style>

      <div className="inv-root">
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4A6A7A", marginBottom: "8px" }}>
            KR Steel · Asset Management
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.02em", color: "#225CA3", margin: 0, lineHeight: 1 }}>
                Inventory Summary
              </h1>
              <p style={{ fontSize: "13px", color: "#7A8A93", marginTop: "6px" }}>
                {filteredInventory.length} items found in shipyard inventory
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="inv-btn inv-btn-outline" onClick={handleOpenAdd}>
                <Plus size={13} /> Add Item
              </button>
              <button className="inv-btn inv-btn-outline" onClick={handleDownloadExcel}>
                <Download size={13} /> Excel
              </button>
              <button className="inv-btn inv-btn-primary" onClick={handleDownloadPDF}>
                <FileText size={13} /> PDF Report
              </button>
            </div>
          </div>
          <div style={{ height: "1px", background: "#D0CBC0", marginTop: "20px" }} />
        </div>

        {/* Search */}
        <div style={{ marginBottom: "24px", position: "relative", maxWidth: "400px" }}>
          <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#7A8A93", pointerEvents: "none" }} />
          <input
            type="text"
            className="inv-search"
            placeholder="Search equipment, description, certs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 38px", fontSize: "13px", color: "#1A1A1A", background: "#FAFAF8", border: "1px solid #D0CBC0", borderRadius: "2px" }}
          />
        </div>

        {/* Table */}
        <div style={{ background: "#FAFAF8", border: "1px solid #D0CBC0", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", background: "#225CA3", borderBottom: "1px solid #D0CBC0" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#EAE7DF", margin: 0 }}>
              Inventory Item Details
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#EAE7DF" }}>
                  {["SL No.", "Equipment Name", "Quantity", "Description", "SWL", "Certificate No.", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#225CA3", borderBottom: "1px solid #D0CBC0", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="inv-tbody">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #EAE7DF" }}>
                      <td style={{ padding: "14px 24px", color: "#7A8A93", fontWeight: 500 }}>{idx + 1}</td>
                      <td style={{ padding: "14px 24px", color: "#1A1A1A", fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: "14px 24px", color: "#4A6A7A" }}>{item.quantity || "—"}</td>
                      <td style={{ padding: "14px 24px", color: "#5A6A73", maxWidth: "300px" }}>{item.description || "—"}</td>
                      <td style={{ padding: "14px 24px", color: "#1A1A1A" }}>
                        {item.swl ? (
                           <span style={{ padding: "2px 8px", background: "rgba(34,92,163,0.06)", border: "1px solid rgba(34,92,163,0.15)", borderRadius: "2px", fontSize: "11px", fontWeight: 600 }}>
                             {item.swl}
                           </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "14px 24px", color: "#225CA3", fontFamily: "monospace", fontSize: "12px" }}>
                        {item.certificateNo || "—"}
                      </td>
                      <td style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
                        <button className="inv-action-btn" onClick={() => handleOpenEdit(item)} title="Edit">
                           <Edit2 size={14} />
                        </button>
                        <button className="inv-action-btn inv-action-btn-del" onClick={() => handleDelete(item.id)} title="Delete">
                           <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: "60px 24px", textAlign: "center", color: "#7A8A93" }}>
                      No inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12, 44, 88, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "500px", borderRadius: "2px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", background: "#225CA3", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <h2 style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                 {editingItem ? "Edit Inventory Item" : "Add New Item"}
               </h2>
               <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", color: "#FFFFFF", cursor: "pointer", opacity: 0.8 }}><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#4A6A7A" }}>Equipment Name *</label>
                  <input required style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#4A6A7A" }}>Quantity</label>
                    <input style={inputStyle} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#4A6A7A" }}>SWL</label>
                    <input style={inputStyle} value={formData.swl} onChange={e => setFormData({...formData, swl: e.target.value})} placeholder="e.g. 5 Ton" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#4A6A7A" }}>Description</label>
                  <textarea style={{...inputStyle, height: "80px", resize: "none"}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#4A6A7A" }}>Certificate Number</label>
                  <input style={inputStyle} value={formData.certificateNo} onChange={e => setFormData({...formData, certificateNo: e.target.value})} />
                </div>
              </div>

              <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="inv-btn inv-btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="inv-btn inv-btn-primary">
                  {editingItem ? "Save Changes" : "Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
