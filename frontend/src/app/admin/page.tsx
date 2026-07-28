"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api-client";
import { icons } from "@/lib/icons";
import type { AdminStats, AuditLogEntry, Appointment, PagedResult } from "@/types/api";

const STATUS_ORDER = ["Requested", "Confirmed", "CheckedIn", "Completed", "Cancelled", "NoShow"] as const;
// Mirrors StatusBadge.tsx's hue families exactly (amber/sky/purple/emerald/slate/red) — the
// same status always reads as the same color everywhere in the app, chart or badge.
const STATUS_COLORS: Record<string, string> = {
  Requested: "#f59e0b",
  Confirmed: "#0ea5e9",
  CheckedIn: "#a855f7",
  Completed: "#10b981",
  Cancelled: "#94a3b8",
  NoShow: "#ef4444",
};

const ROLE_ORDER = ["Admin", "Doctor", "Receptionist", "Patient"] as const;
// Validated categorical palette, slots 1-4 in fixed order (never cycled/reassigned) — see
// dataviz skill: worst adjacent CVD deltaE 9.1, normal-vision deltaE 22.9, both pass.
const ROLE_COLORS: Record<string, string> = {
  Admin: "#2a78d6",
  Doctor: "#eb6834",
  Receptionist: "#1baf7a",
  Patient: "#eda100",
};

function StatCard({ icon, label, value, accent }: { icon: typeof icons.dashboard; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${accent}1a`, color: accent }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
      {children}
    </div>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    api.get<AdminStats>("/api/v1/admin/stats").then(setStats);

    api
      .get<PagedResult<AuditLogEntry>>("/api/v1/audit-logs", { page: 1, pageSize: 6, sortDir: "desc" })
      .then((r) => setRecentActivity(r.items));

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    api
      .get<PagedResult<Appointment>>("/api/v1/appointments", {
        page: 1,
        pageSize: 6,
        fromUtc: startOfDay.toISOString(),
        toUtc: endOfDay.toISOString(),
        sortBy: "scheduledStart",
      })
      .then((r) => setTodaysAppointments(r.items));
  }, []);

  if (!stats) {
    return <FontAwesomeIcon icon={icons.spinner} className="animate-spin text-2xl text-sky-600" />;
  }

  const statusData = STATUS_ORDER.map((status) => ({ status, count: stats.appointmentsByStatus[status] ?? 0 }));
  const roleData = ROLE_ORDER.map((role) => ({ role, count: stats.usersByRole[role] ?? 0 }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">System-wide stats, activity, and today&apos;s schedule.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={icons.account} label="Total accounts" value={stats.totalUsers} accent="#2a78d6" />
        <StatCard icon={icons.doctors} label="Doctors" value={stats.totalDoctors} accent="#1baf7a" />
        <StatCard icon={icons.patients} label="Patients" value={stats.totalPatients} accent="#eda100" />
        <StatCard icon={icons.appointments} label="Appointments today" value={stats.appointmentsToday} accent="#eb6834" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Appointments by status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" tickLine={false} axisLine={false} width={28} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.1)" }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
                <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: "#64748b" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Accounts by role">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roleData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
              <XAxis dataKey="role" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" tickLine={false} axisLine={false} width={28} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.1)" }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {roleData.map((entry) => (
                  <Cell key={entry.role} fill={ROLE_COLORS[entry.role]} />
                ))}
                <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: "#64748b" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent activity</h2>
            <Link href="/admin/audit-log" className="text-xs font-medium text-sky-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{entry.userEmail ?? "System"}</span>{" "}
                  {entry.action.toLowerCase()} {entry.entityName.toLowerCase()}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(entry.createdAtUtc)}</span>
              </li>
            ))}
            {recentActivity.length === 0 && <li className="py-4 text-center text-sm text-slate-400">No activity yet.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Today&apos;s appointments</h2>
            <Link href="/appointments" className="text-xs font-medium text-sky-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {todaysAppointments.map((appointment) => (
              <li key={appointment.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{appointment.patientName}</span> with Dr.{" "}
                  {appointment.doctorName}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(appointment.scheduledStartUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
            {todaysAppointments.length === 0 && <li className="py-4 text-center text-sm text-slate-400">Nothing scheduled today.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
