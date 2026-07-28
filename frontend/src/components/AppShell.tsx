"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/lib/auth-context";
import { icons } from "@/lib/icons";
import { NotificationBell } from "@/components/NotificationBell";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={icons.menu} />
          </button>

          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white md:hidden">
            <FontAwesomeIcon icon={icons.brand} className="text-sky-600" />
          </Link>

          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">{user?.fullName}</span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FontAwesomeIcon icon={icons.logout} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

        <footer className="border-t border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <span>&copy; {new Date().getFullYear()} Hospital Appointment System</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-slate-700 dark:hover:text-slate-200">
                <FontAwesomeIcon icon={icons.github} size="lg" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-slate-700 dark:hover:text-slate-200">
                <FontAwesomeIcon icon={icons.linkedin} size="lg" />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="hover:text-slate-700 dark:hover:text-slate-200">
                <FontAwesomeIcon icon={icons.twitter} size="lg" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
