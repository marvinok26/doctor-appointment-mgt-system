"use client";

import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";

const pageLabels: Record<string, string> = {
  "/admin/users": "Users",
  "/admin/audit-log": "Audit log",
};

// The overview/stats content lives on /dashboard for Admins (see AdminOverviewSection) rather
// than a separate "/admin" page, so there's no single "Admin home" to link the crumb to — Users
// and Audit log are siblings under the Admin section of the sidebar, not children of an overview.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const label = pageLabels[pathname];

  return (
    <RequireAuth roles={["Admin"]} crumbs={[{ label: "Admin" }, ...(label ? [{ label }] : [])]}>
      {children}
    </RequireAuth>
  );
}
