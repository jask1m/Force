"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className={cn(
        "flex-1 overflow-auto transition-all duration-200 ease-in-out",
        "lg:ml-64" // Always offset on large screens
      )}>
        {/* Mobile overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <main className="p-6">
          <Header />
          {children}
        </main>
      </div>
    </div>
  );
}