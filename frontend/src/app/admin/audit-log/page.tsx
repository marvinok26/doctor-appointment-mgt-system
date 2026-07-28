"use client";

import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/lib/toast-context";
import { api } from "@/lib/api-client";
import type { AuditAction, AuditLogEntry, PagedResult } from "@/types/api";

const ACTIONS: AuditAction[] = ["Create", "Update", "Delete", "Login", "LoginFailed", "Logout", "TokenRefresh", "MfaEnabled", "MfaChallenge"];

const actionStyles: Partial<Record<AuditAction, string>> = {
  LoginFailed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Login: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Delete: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Create: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

export default function AuditLogPage() {
  const { notify } = useToast();
  const [result, setResult] = useState<PagedResult<AuditLogEntry> | null>(null);
  const [action, setAction] = useState<AuditAction | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(() => {
    api
      .get<PagedResult<AuditLogEntry>>("/api/v1/audit-logs", { page, pageSize, action: action || undefined, sortDir: "desc" })
      .then(setResult)
      .catch(() => notify("Failed to load the audit log.", "error"));
  }, [page, pageSize, action, notify]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <select
        className="w-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        value={action}
        onChange={(e) => {
          setPage(1);
          setAction(e.target.value as AuditAction | "");
        }}
      >
        <option value="">All actions</option>
        {ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">IP address</th>
              </tr>
            </thead>
            <tbody>
              {result?.items.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(entry.createdAtUtc).toLocaleString([], { dateStyle: "medium", timeStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{entry.userEmail ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${actionStyles[entry.action] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {entry.entityName}
                    {entry.entityId && <span className="ml-1 text-xs text-slate-400">#{entry.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{entry.ipAddress}</td>
                </tr>
              ))}
              {result?.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No audit events found.
                  </td>
                </tr>
              )}
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
    </div>
  );
}
