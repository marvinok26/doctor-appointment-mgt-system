"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "@/lib/api-client";
import { icons } from "@/lib/icons";
import type { AdminStats } from "@/types/api";

const STATUS_ORDER = ["Requested", "Confirmed", "CheckedIn", "Completed", "Cancelled", "NoShow"];
const ROLE_ORDER = ["Admin", "Doctor", "Receptionist", "Patient"];

function StatCard({ icon, label, value }: { icon: typeof icons.dashboard; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10">
        <FontAwesomeIcon icon={icon} className="text-xl" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/api/v1/admin/stats").then(setStats);
  }, []);

  if (!stats) {
    return <FontAwesomeIcon icon={icons.spinner} className="animate-spin text-2xl text-sky-600" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={icons.account} label="Total accounts" value={stats.totalUsers} />
        <StatCard icon={icons.doctors} label="Doctors" value={stats.totalDoctors} />
        <StatCard icon={icons.patients} label="Patients" value={stats.totalPatients} />
        <StatCard icon={icons.appointments} label="Appointments today" value={stats.appointmentsToday} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Accounts by role</h2>
          <div className="flex flex-col gap-3">
            {ROLE_ORDER.map((role) => {
              const count = stats.usersByRole[role] ?? 0;
              const max = Math.max(...Object.values(stats.usersByRole), 1);
              return (
                <div key={role} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-slate-600 dark:text-slate-300">{role}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm text-slate-500 dark:text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Appointments by status</h2>
          <div className="flex flex-col gap-3">
            {STATUS_ORDER.map((status) => {
              const count = stats.appointmentsByStatus[status] ?? 0;
              const max = Math.max(...Object.values(stats.appointmentsByStatus), 1);
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-slate-600 dark:text-slate-300">{status}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm text-slate-500 dark:text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
