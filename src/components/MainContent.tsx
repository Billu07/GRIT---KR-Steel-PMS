"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { clsx } from "clsx";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebar();

  return (
    <main
      className={clsx(
        "flex-1 transition-[margin] duration-300 ease-in-out min-w-0 overflow-y-auto",
        "p-4 md:p-10", // Less padding on mobile
        isOpen ? "md:ml-64" : "ml-0"
      )}
    >
      {children}
    </main>
  );
}
