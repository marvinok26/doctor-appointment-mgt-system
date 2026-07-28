"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/lib/auth-context";
import { icons } from "@/lib/icons";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: icons.dashboard, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
  { href: "/appointments", label: "Appointments", icon: icons.appointments, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
  { href: "/doctors", label: "Doctors", icon: icons.doctors, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
  { href: "/patients", label: "Patients", icon: icons.patients, roles: ["Admin", "Doctor", "Receptionist"] },
  { href: "/notifications", label: "Notifications", icon: icons.notifications, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
  { href: "/admin", label: "Admin", icon: icons.admin, roles: ["Admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <FontAwesomeIcon icon={icons.brand} className="text-sky-600" />
          Hospital Appointment System
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems
            .filter((item) => hasRole(...(item.roles as never[])))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} />
                {item.label}
              </Link>
            ))}
        </nav>

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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>

      <footer className="border-t border-slate-200 px-6 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
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
  );
}
