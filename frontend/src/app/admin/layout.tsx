"use client";

import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";

const pageLabels: Record<string, string> = {
  "/admin": "Overview",
  "/admin/users": "Users",
  "/admin/audit-log": "Audit log",
};

// Navigation between these three pages now lives in the sidebar (see Sidebar.tsx's "Admin"
// section) — this layout just wraps them with the Admin-only guard and a matching breadcrumb.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const label = pageLabels[pathname];

  return (
    <RequireAuth roles={["Admin"]} crumbs={[{ label: "Admin", href: "/admin" }, ...(label && label !== "Overview" ? [{ label }] : [])]}>
      {children}
    </RequireAuth>
  );
}
