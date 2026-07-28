import type { AppointmentStatus } from "@/types/api";

const statusStyles: Record<AppointmentStatus, string> = {
  Requested: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  CheckedIn: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300",
  Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  NoShow: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
