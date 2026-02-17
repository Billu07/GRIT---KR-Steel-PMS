"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Supabase client — reads from your .env.local
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const BUCKET = "equipment-images";

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  categoryId: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any; // For editing
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categoryId,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    location: "",
    description: "",
    status: "active",
    selectedCategoryId: categoryId ? String(categoryId) : "",
    imageUrl: "",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch categories if not provided via props (or always to be safe)
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        location: initialData.location || "",
        description: initialData.description || "",
        status: initialData.status || "active",
        selectedCategoryId: initialData.categoryId
          ? String(initialData.categoryId)
          : categoryId
            ? String(categoryId)
            : "",
        imageUrl: initialData.imageUrl || "",
      });
      setImagePreview(initialData.imageUrl || "");
    } else {
      // Reset for new entry
      setFormData({
        code: "",
        name: "",
        location: "",
        description: "",
        status: "active",
        selectedCategoryId: categoryId ? String(categoryId) : "",
        imageUrl: "",
      });
      setImagePreview("");
      setImageFile(null);
    }
  }, [initialData, categoryId, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (code: string): Promise<string> => {
    if (!imageFile) return "";
    const ext = imageFile.name.split(".").pop();
    const path = `${code}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, imageFile, { upsert: true });
    if (error) throw new Error("Image upload failed");
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedCategoryId) {
      alert("Please select a category");
      return;
    }
    setUploading(true);
    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(formData.code || "eq");
      }
      onSubmit({
        ...formData,
        categoryId: parseInt(formData.selectedCategoryId),
        imageUrl,
      });
      // Don't auto-close here, let parent handle success/close
    } catch {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!initialData;
  const isCategoryLocked = !!categoryId && !isEditing;

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

        .eq-modal-field:focus {
          border-color: #1A3A52 !important;
          box-shadow: 0 0 0 3px rgba(26,58,82,0.07) !important;
        }
        .eq-modal-field::placeholder { color: #C0BAB0; }

        .eq-modal-cancel {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #1A3A52; background: transparent;
          border: 1px solid #D0CBC0; border-radius: 2px;
          cursor: pointer; transition: all 0.15s ease;
        }
        .eq-modal-cancel:hover { border-color: #1A3A52; background: rgba(26,58,82,0.04); }

        .eq-modal-submit {
          padding: 10px 20px;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #EAE7DF; background: #1A3A52;
          border: none; border-radius: 2px;
          cursor: pointer; transition: background 0.15s ease;
        }
        .eq-modal-submit:hover:not(:disabled)  { background: #1F4460; }
        .eq-modal-submit:active:not(:disabled) { background: #132D40; }
        .eq-modal-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .eq-upload-zone {
          border: 1.5px dashed #D0CBC0;
          background: #F5F3EF;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px; padding: 28px 16px;
          cursor: pointer; text-align: center;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .eq-upload-zone:hover {
          border-color: #1A3A52;
          background: #EAF1F6;
        }

        @keyframes eq-modal-in {
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
            maxWidth: "480px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #D0CBC0",
            fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
            WebkitFontSmoothing: "antialiased",
            animation: "eq-modal-in 0.2s cubic-bezier(0.22,1,0.36,1) both",
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
              {isEditing ? "Edit Equipment" : "Add New Equipment"}
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
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EAE7DF")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(234,231,223,0.6)")
              }
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                overflowY: "auto",
                padding: "24px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  name="selectedCategoryId"
                  value={formData.selectedCategoryId}
                  onChange={handleChange}
                  required
                  className="eq-modal-field"
                  style={{
                    ...selectStyle,
                    opacity: isCategoryLocked ? 0.7 : 1,
                    pointerEvents: isCategoryLocked ? "none" : "auto",
                    background: isCategoryLocked ? "#F0EDE6" : "#FAFAF8",
                  }}
                  disabled={isCategoryLocked}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code + Status */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div>
                  <label style={labelStyle}>Equipment Code</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className="eq-modal-field"
                    style={fieldStyle}
                    placeholder="e.g. EQ-001"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="eq-modal-field"
                    style={selectStyle}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="eq-modal-field"
                  style={fieldStyle}
                  placeholder="e.g. Overhead Crane"
                />
              </div>

              {/* Location */}
              <div>
                <label style={labelStyle}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="eq-modal-field"
                  style={fieldStyle}
                  placeholder="e.g. Bay A"
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="eq-modal-field"
                  style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>

              {/* Image upload */}
              <div>
                <label style={labelStyle}>
                  Equipment Image{" "}
                  <span
                    style={{ opacity: 0.5, fontWeight: 400, letterSpacing: 0 }}
                  >
                    (optional)
                  </span>
                </label>

                {imagePreview ? (
                  <div
                    style={{
                      position: "relative",
                      border: "1px solid #D0CBC0",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "160px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "28px",
                        height: "28px",
                        background: "rgba(10,20,30,0.72)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                    >
                      <X size={13} />
                    </button>
                    {/* File name strip */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "6px 12px",
                        background: "rgba(10,20,30,0.6)",
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.75)",
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {imageFile?.name || "Existing Image"}
                    </div>
                  </div>
                ) : (
                  <div
                    className="eq-upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={20} style={{ color: "#8FBED6" }} />
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#5A6A73",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      Click to upload an image
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#7A8A93",
                        margin: 0,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      JPG · PNG · WebP &nbsp;·&nbsp; Max 5MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
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
              <button
                type="button"
                className="eq-modal-cancel"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="eq-modal-submit"
                disabled={uploading}
              >
                {uploading ? "Saving…" : isEditing ? "Save Changes" : "Create Equipment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EquipmentModal;
