import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { RightWidgetSidebar } from "./RightWidgetSidebar";
import { MobileNavbar } from "./MobileNavbar";
import { PageTransition } from "../common/Animations";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex justify-center transition-colors">
      <div className="w-full max-w-7xl flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Main Content Viewport */}
        <main className="flex-1 min-h-screen border-r border-pure-border-light dark:border-pure-border-dark pb-20 lg:pb-0 min-w-0">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>

        {/* Right Widget Sidebar */}
        <RightWidgetSidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNavbar />
    </div>
  );
}
