"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/lib/auth-context";
import { icons } from "@/lib/icons";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import type { Role } from "@/types/api";

export function RequireAuth({
  children,
  roles,
  crumbs,
}: {
  children: React.ReactNode;
  roles?: Role[];
  /** Trail shown above the page content, e.g. [{ label: "Admin", href: "/admin" }, { label: "Users" }]. Omit on the dashboard itself. */
  crumbs?: Crumb[];
}) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FontAwesomeIcon icon={icons.spinner} className="animate-spin text-2xl text-sky-600" />
      </div>
    );
  }

  if (!user) return null;

  if (roles && !hasRole(...roles)) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 py-20 text-center text-slate-600 dark:text-slate-300">
          <FontAwesomeIcon icon={icons.warning} className="text-3xl text-amber-500" />
          <p>You don&apos;t have permission to view this page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {crumbs && <Breadcrumbs items={crumbs} />}
      {children}
    </AppShell>
  );
}
