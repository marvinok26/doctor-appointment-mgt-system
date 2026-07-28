"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/lib/auth-context";
import { icons } from "@/lib/icons";
import type { Role } from "@/types/api";

interface NavItem {
  href: string;
  label: string;
  icon: typeof icons.dashboard;
  roles: Role[];
}

/**
 * Every role sees "Dashboard" first, then whatever's relevant to them — a Patient never sees
 * "Patients" (the staff directory) or "Admin", a Doctor never sees "Admin". Admin gets three
 * dedicated entries (Overview/Users/Audit log) instead of one link into a tabbed sub-page, since
 * those are the destinations, not steps in a flow.
 */
const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: icons.dashboard, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
  { href: "/appointments", label: "Appointments", icon: icons.appointments, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
  { href: "/doctors", label: "Doctors", icon: icons.doctors, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
  { href: "/patients", label: "Patients", icon: icons.patients, roles: ["Admin", "Doctor", "Receptionist"] },
  { href: "/notifications", label: "Notifications", icon: icons.notifications, roles: ["Admin", "Doctor", "Receptionist", "Patient"] },
];

// No "Overview" entry here — that content lives on /dashboard itself for Admins
// (see AdminOverviewSection), so "Dashboard" above already is the admin's overview.
const adminItems: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: icons.manageUsers, roles: ["Admin"] },
  { href: "/admin/audit-log", label: "Audit log", icon: icons.auditLog, roles: ["Admin"] },
];

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <FontAwesomeIcon icon={item.icon} className="w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { hasRole } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  const content = (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-2 border-b border-slate-200 px-4 py-4 dark:border-slate-800 ${collapsed ? "justify-center" : ""}`}>
        <FontAwesomeIcon icon={icons.brand} className="shrink-0 text-lg text-sky-600" />
        {!collapsed && <span className="truncate font-semibold text-slate-900 dark:text-white">Hospital System</span>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems
          .filter((item) => hasRole(...item.roles))
          .map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
          ))}

        {hasRole("Admin") && (
          <>
            <div className={`mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? "text-center" : ""}`}>
              {collapsed ? "—" : "Admin"}
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      <button
        onClick={onToggle}
        className="hidden items-center justify-center gap-2 border-t border-slate-200 py-3 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 md:flex"
      >
        <FontAwesomeIcon icon={collapsed ? icons.chevronRight : icons.chevronLeft} />
        {!collapsed && "Collapse"}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 md:block ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl dark:bg-slate-900">{content}</aside>
        </div>
      )}
    </>
  );
}
