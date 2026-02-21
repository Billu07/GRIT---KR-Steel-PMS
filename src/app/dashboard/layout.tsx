import React from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";
import MainContent from "@/components/MainContent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div
        className="relative"
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#F5F3EF",
          fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
