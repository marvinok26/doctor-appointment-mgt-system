"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { api } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { icons } from "@/lib/icons";
import type { NotificationItem, PagedResult } from "@/types/api";

function NotificationsContent() {
  const { notify } = useToast();
  const [result, setResult] = useState<PagedResult<NotificationItem> | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(() => {
    api
      .get<PagedResult<NotificationItem>>("/api/v1/notifications", { page, pageSize, unreadOnly })
      .then(setResult)
      .catch(() => notify("Failed to load notifications.", "error"));
  }, [page, pageSize, unreadOnly, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    await api.patch(`/api/v1/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post("/api/v1/notifications/read-all");
    notify("All notifications marked as read.", "success");
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Notifications</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setPage(1);
                setUnreadOnly(e.target.checked);
              }}
              className="rounded border-slate-300"
            />
            Unread only
          </label>
          <Button variant="secondary" onClick={markAllRead}>
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <ul>
          {result?.items.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800 ${
                !n.isRead ? "bg-sky-50/50 dark:bg-sky-500/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-500/10">
                  <FontAwesomeIcon icon={icons.notifications} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAtUtc).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markRead(n.id)}
                  className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Mark as read
                </button>
              )}
            </li>
          ))}
          {result?.items.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-slate-400">Nothing here yet.</li>
          )}
        </ul>
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
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth crumbs={[{ label: "Notifications" }]}>
      <NotificationsContent />
    </RequireAuth>
  );
}
