"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/Button";
import { BookAppointmentModal } from "@/components/BookAppointmentModal";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api, ApiError } from "@/lib/api-client";
import { icons } from "@/lib/icons";
import type { Appointment, AppointmentStatus, PagedResult } from "@/types/api";

const STATUS_OPTIONS: AppointmentStatus[] = ["Requested", "Confirmed", "CheckedIn", "Completed", "Cancelled", "NoShow"];

const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  Requested: ["Confirmed", "Cancelled"],
  Confirmed: ["CheckedIn", "Cancelled", "NoShow"],
  CheckedIn: ["Completed"],
};

function AppointmentsContent() {
  const { hasRole } = useAuth();
  const { notify } = useToast();
  const canManage = hasRole("Doctor", "Receptionist", "Admin");

  const [result, setResult] = useState<PagedResult<Appointment> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<PagedResult<Appointment>>("/api/v1/appointments", {
        page,
        pageSize,
        status: status || undefined,
        sortBy: "scheduledStart",
        sortDir,
      })
      .then(setResult)
      .catch(() => notify("Failed to load appointments.", "error"))
      .finally(() => setLoading(false));
  }, [page, pageSize, status, sortDir, notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load() fetches the current page on mount/dependency change
    load();
  }, [load]);

  const updateStatus = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    try {
      await api.patch(`/api/v1/appointments/${appointment.id}/status`, { status: newStatus });
      notify(`Appointment marked as ${newStatus}.`, "success");
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update appointment.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Appointments</h1>
        <Button icon={icons.add} onClick={() => setShowBookModal(true)}>
          Book appointment
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <FontAwesomeIcon icon={icons.filter} className="text-slate-400" />
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as AppointmentStatus | "");
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          <FontAwesomeIcon icon={sortDir === "asc" ? icons.sortUp : icons.sortDown} />
          Date
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">
                  <FontAwesomeIcon icon={icons.clock} className="mr-1" />
                  When
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
                {canManage && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <FontAwesomeIcon icon={icons.spinner} className="animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && result?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No appointments found.
                  </td>
                </tr>
              )}
              {!loading &&
                result?.items.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      Dr. {appointment.doctorName}
                      <span className="block text-xs text-slate-400">{appointment.doctorSpecialty}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{appointment.patientName}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(appointment.scheduledStartUtc).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500 dark:text-slate-400">{appointment.reason}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        {(NEXT_STATUS[appointment.status] ?? []).length > 0 && (
                          <select
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) updateStatus(appointment, e.target.value as AppointmentStatus);
                              e.target.value = "";
                            }}
                          >
                            <option value="" disabled>
                              Update status
                            </option>
                            {(NEXT_STATUS[appointment.status] ?? []).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {result && (
          <Pagination
            result={result}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
          />
        )}
      </div>

      {showBookModal && (
        <BookAppointmentModal
          onClose={() => setShowBookModal(false)}
          onBooked={() => {
            setShowBookModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <RequireAuth crumbs={[{ label: "Appointments" }]}>
      <AppointmentsContent />
    </RequireAuth>
  );
}
