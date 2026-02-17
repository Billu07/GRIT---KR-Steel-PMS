"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebar();

  return (
    <main
      style={{
        flex: 1,
        marginLeft: isOpen ? "256px" : "0px",
        padding: "40px 44px",
        overflowY: "auto",
        minWidth: 0,
        transition: "margin-left 300ms ease",
      }}
    >
      {children}
    </main>
  );
}
