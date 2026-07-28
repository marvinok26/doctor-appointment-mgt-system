"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminOverviewSection } from "@/components/admin/AdminOverviewSection";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { icons } from "@/lib/icons";
import type { PagedResult } from "@/types/api";

function useCount(path: string, deps: unknown[]) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // pageSize=1 keeps this a cheap "just give me the total" call rather than fetching full rows.
    api
      .get<PagedResult<unknown>>(path, { page: 1, pageSize: 1 })
      .then((r) => !cancelled && setCount(r.totalCount))
      .catch(() => !cancelled && setCount(null));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return count;
}

function DashboardHeader() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Welcome back, {user?.fullName}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Signed in as {user?.roles.join(", ")}
        {user && !user.mfaEnabled && (
          <>
            {" "}·{" "}
            <Link href="/settings/mfa" className="text-sky-600 hover:underline">
              Enable two-factor authentication
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function StaffPatientDashboard() {
  const { user, hasRole } = useAuth();
  const upcomingCount = useCount("/api/v1/appointments", [user?.id, "Requested"]);
  const doctorCount = useCount("/api/v1/doctors", [user?.id]);

  const cards = [
    { label: "My/Team Appointments", value: upcomingCount, icon: icons.appointments, href: "/appointments" },
    { label: "Doctors", value: doctorCount, icon: icons.doctors, href: "/doctors" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10">
              <FontAwesomeIcon icon={card.icon} className="text-xl" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{card.value ?? "—"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/appointments" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
            {hasRole("Patient") ? "Book an appointment" : "View appointments"}
          </Link>
        </div>
      </div>
    </>
  );
}

function DashboardContent() {
  const { hasRole } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />
      {hasRole("Admin") ? <AdminOverviewSection /> : <StaffPatientDashboard />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

