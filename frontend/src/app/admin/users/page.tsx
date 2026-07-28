"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Input } from "@/components/Input";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/lib/toast-context";
import { api, ApiError } from "@/lib/api-client";
import { icons } from "@/lib/icons";
import type { PagedResult, Role, UserSummary } from "@/types/api";

const ROLES: Role[] = ["Admin", "Doctor", "Receptionist", "Patient"];

export default function AdminUsersPage() {
  const { notify } = useToast();
  const [result, setResult] = useState<PagedResult<UserSummary> | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(() => {
    api
      .get<PagedResult<UserSummary>>("/api/v1/users", { page, pageSize, search: search || undefined, role: role || undefined })
      .then(setResult)
      .catch(() => notify("Failed to load users.", "error"));
  }, [page, pageSize, search, role, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLockout = async (user: UserSummary) => {
    try {
      await api.patch(`/api/v1/users/${user.id}/lockout`, { locked: !user.lockedOut });
      notify(user.lockedOut ? "Account unlocked." : "Account locked.", "success");
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update account.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Input
          icon={icons.search}
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-xs"
        />
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as Role | "");
          }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">MFA</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {result?.items.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.roles.join(", ")}</td>
                <td className="px-4 py-3">
                  {u.mfaEnabled ? (
                    <FontAwesomeIcon icon={icons.mfa} className="text-emerald-600" />
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.lockedOut
                        ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    }`}
                  >
                    {u.lockedOut ? "Locked" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleLockout(u)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <FontAwesomeIcon icon={u.lockedOut ? icons.unlockUser : icons.lockUser} />
                    {u.lockedOut ? "Unlock" : "Lock"}
                  </button>
                </td>
              </tr>
            ))}
            {result?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
