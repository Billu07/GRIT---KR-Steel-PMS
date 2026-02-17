"use client";
// Add to your layout.tsx or globals.css:
// @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  List,
} from "lucide-react";
import { clsx } from "clsx";
import { CATEGORIES } from "@/lib/mockData";
import { useSidebar } from "@/context/SidebarContext";

const SidebarContent = () => {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const [equipmentOpen, setEquipmentOpen] = useState(true);

  const categories = Object.values(CATEGORIES);

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: "8px",
            background: "#1A3A52",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            lineHeight: 0,
          }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop collapse toggle — sits outside aside, always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex"
        style={{
          position: "fixed",
          top: "50%",
          left: isOpen ? "252px" : "0px",
          transform: "translateY(-50%)",
          zIndex: 50,
          alignItems: "center",
          justifyContent: "center",
          width: "18px",
          height: "48px",
          background: "#1A3A52",
          color: "#C8DFE8",
          border: "none",
          cursor: "pointer",
          transition: "left 300ms ease",
          borderRadius: "0 3px 3px 0",
        }}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <ChevronRight size={12} />
        ) : (
          <ChevronRight size={12} style={{ transform: "rotate(180deg)" }} />
        )}
      </button>

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "256px",
          background: "#1A3A52",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          transition: "transform 300ms ease",
          transform: isOpen ? "translateX(0)" : "translateX(-256px)",
          fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "28px 28px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#FFFFFF",
              margin: 0,
              lineHeight: 1,
              fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
            }}
          >
            KR Steel
          </p>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#A8C8D8",
              marginTop: "7px",
              fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
            }}
          >
            Shipyard PMS
          </p>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <NavLink href="/dashboard" pathname={pathname} label="Dashboard" />
          <NavLink
            href="/dashboard/registry"
            pathname={pathname}
            label="Equipment Registry"
          />

          {/* Equipment accordion */}
          <div>
            <button
              onClick={() => setEquipmentOpen(!equipmentOpen)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                color: "#C8DFE8",
                cursor: "pointer",
                fontSize: "13px",
                letterSpacing: "0.06em",
                fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
                textTransform: "uppercase",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#C8DFE8")}
            >
              <span>Equipment</span>
              <span
                style={{
                  transition: "transform 200ms ease",
                  transform: equipmentOpen ? "rotate(90deg)" : "rotate(0deg)",
                  display: "inline-flex",
                  color: "#8FBDD0",
                }}
              >
                <ChevronRight size={13} />
              </span>
            </button>

            {equipmentOpen && (
              <div
                style={{
                  marginLeft: "12px",
                  paddingLeft: "14px",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  marginTop: "2px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                }}
              >
                {categories.map((category) => {
                  const href = `/dashboard/equipment/${category.id}`;
                  const isActive = pathname === href;

                  return (
                    <Link
                      key={category.id}
                      href={href}
                      title={category.name}
                      style={{
                        display: "block",
                        padding: "8px 10px",
                        fontSize: "12px",
                        letterSpacing: "0.04em",
                        color: isActive ? "#fff" : "#A8C4D4",
                        background: isActive
                          ? "rgba(255,255,255,0.09)"
                          : "transparent",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        borderLeft: isActive
                          ? "2px solid #8FBED6"
                          : "2px solid transparent",
                        transition: "all 150ms ease",
                        fontFamily:
                          "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
                      }}
                    >
                      {category.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <NavLink
            href="/dashboard/reports"
            pathname={pathname}
            label="Reports"
          />
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <Link
            href="/login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              color: "#8FBDD0",
              textDecoration: "none",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C8DFE8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8FBDD0")}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

/* ─── Reusable nav link ─────────────────────────────────────────── */
function NavLink({
  href,
  pathname,
  label,
}: {
  href: string;
  pathname: string;
  label: string;
}) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "10px 12px",
        fontSize: "13px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: isActive ? "#ffffff" : "#B8CFDE",
        background: isActive ? "rgba(255,255,255,0.09)" : "transparent",
        borderLeft: isActive ? "2px solid #8FBED6" : "2px solid transparent",
        textDecoration: "none",
        fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
        transition: "all 150ms ease",
      }}
    >
      {label}
    </Link>
  );
}

/* ─── Wrapper ───────────────────────────────────────────────────── */
const Sidebar = () => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "256px",
            background: "#1A3A52",
          }}
        />
      }
    >
      <SidebarContent />
    </Suspense>
  );
};

export default Sidebar;
