"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-log", label: "Audit log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = tabs.find((tab) => (tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href)));

  return (
    <RequireAuth
      roles={["Admin"]}
      crumbs={[{ label: "Admin", href: "/admin" }, ...(activeTab && activeTab.href !== "/admin" ? [{ label: activeTab.label }] : [])]}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Admin</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">System overview, account management, and the audit trail.</p>
        </div>

        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-sky-600 text-sky-700 dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </RequireAuth>
  );
}
