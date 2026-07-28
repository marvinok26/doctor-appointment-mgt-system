"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getAppointmentHubConnection } from "@/lib/signalr";
import { api } from "@/lib/api-client";
import type { Appointment, NotificationItem } from "@/types/api";

/**
 * Backed by the persisted Notification table (not just an in-session list): the unread count
 * and recent items load from the API on mount, and a live SignalR push ("NotificationCreated",
 * plus appointment events) tops the count up instantly without waiting for the next poll.
 */
export function NotificationBell() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [recent, setRecent] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const bumpedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    api.get<number>("/api/v1/notifications/unread-count").then(setUnread).catch(() => {});
    api
      .get<{ items: NotificationItem[] }>("/api/v1/notifications", { page: 1, pageSize: 5 })
      .then((r) => setRecent(r.items))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const connection = getAppointmentHubConnection();

    const bump = (message: string) => {
      setUnread((n) => n + 1);
      notify(message, "info");
      bumpedRef.current = true;
    };

    connection.on("NotificationCreated", (payload: { title: string; message: string }) => bump(payload.message));
    connection.on("AppointmentCreated", (appointment: Appointment) => bump(`New appointment booked with Dr. ${appointment.doctorName}`));
    connection.on("AppointmentUpdated", (appointment: Appointment) => bump(`Appointment with Dr. ${appointment.doctorName} is now ${appointment.status}`));

    if (connection.state === "Disconnected") {
      connection.start().catch(() => {
        // Real-time updates are a convenience layer; a failed connection shouldn't block the rest of the app.
      });
    }

    return () => {
      connection.off("NotificationCreated");
      connection.off("AppointmentCreated");
      connection.off("AppointmentUpdated");
    };
  }, [user, notify]);

  const openMenu = () => {
    setOpen((v) => !v);
    if (bumpedRef.current) {
      // A live push arrived since we last fetched — refresh the recent list to show it.
      api
        .get<{ items: NotificationItem[] }>("/api/v1/notifications", { page: 1, pageSize: 5 })
        .then((r) => setRecent(r.items))
        .catch(() => {});
      bumpedRef.current = false;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={openMenu}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <FontAwesomeIcon icon={icons.notifications} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
            Notifications
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {recent.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Nothing here yet.</li>}
            {recent.map((n) => (
              <li key={n.id} className="border-b border-slate-100 px-4 py-3 text-sm last:border-0 dark:border-slate-800">
                <p className="font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                <p className="text-slate-500 dark:text-slate-400">{n.message}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-sky-600 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
