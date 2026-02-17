"use client";

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

const SidebarContent = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [equipmentOpen, setEquipmentOpen] = useState(true);

  const categories = Object.values(CATEGORIES);

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-800 text-white rounded-md"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside
        className={clsx(
          "fixed top-0 left-0 h-screen w-64 bg-[#1A3A52] text-white flex flex-col transition-transform duration-300 z-40",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="p-6 border-b border-gray-700 shrink-0">
          <h1 className="text-2xl font-extrabold tracking-widest uppercase text-white">
            KR Steel
          </h1>
          <p className="text-xs text-blue-200 font-medium tracking-wide mt-1 uppercase">
            Shipyard PMS
          </p>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <Link
            href="/dashboard"
            className={clsx(
              "flex items-center p-3 rounded-lg transition-colors hover:bg-blue-600",
              pathname === "/dashboard" ? "bg-blue-600" : "",
            )}
          >
            <LayoutDashboard size={20} className="mr-3" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/registry"
            className={clsx(
              "flex items-center p-3 rounded-lg transition-colors hover:bg-blue-600",
              pathname === "/dashboard/registry" ? "bg-blue-600" : "",
            )}
          >
            <List size={20} className="mr-3" />
            <span>Equipment Registry</span>
          </Link>

          <div>
            <button
              onClick={() => setEquipmentOpen(!equipmentOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <Wrench size={20} className="mr-3" />
                <span>Equipment</span>
              </div>
              {equipmentOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {equipmentOpen && (
              <div className="ml-4 pl-4 border-l border-gray-600 space-y-1 mt-1">
                {categories.map((category) => {
                  const href = `/dashboard/equipment/${category.id}`;
                  const isActive = pathname === href;

                  return (
                    <Link
                      key={category.id}
                      href={href}
                      className={clsx(
                        "block p-2 text-sm rounded-md hover:bg-gray-700 transition-colors truncate",
                        isActive ? "bg-blue-500 text-white" : "text-gray-300",
                      )}
                      title={category.name}
                    >
                      {category.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/dashboard/reports"
            className={clsx(
              "flex items-center p-3 rounded-lg transition-colors hover:bg-blue-600",
              pathname === "/dashboard/reports" ? "bg-blue-600" : "",
            )}
          >
            <FileText size={20} className="mr-3" />
            <span>Reports</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700 shrink-0">
          <Link
            href="/login"
            className="flex items-center w-full p-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

const Sidebar = () => {
  return (
    <Suspense
      fallback={
        <div className="fixed top-0 left-0 h-screen w-64 bg-[#1A3A52] text-white">
          Loading...
        </div>
      }
    >
      <SidebarContent />
    </Suspense>
  );
};

export default Sidebar;
