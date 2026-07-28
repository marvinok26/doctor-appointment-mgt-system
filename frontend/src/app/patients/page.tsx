"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Pagination } from "@/components/Pagination";
import { Input } from "@/components/Input";
import { api } from "@/lib/api-client";
import { icons } from "@/lib/icons";
import type { PagedResult, Patient } from "@/types/api";

function PatientsContent() {
  const [result, setResult] = useState<PagedResult<Patient> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(() => {
    api.get<PagedResult<Patient>>("/api/v1/patients", { page, pageSize, search: search || undefined }).then(setResult);
  }, [page, pageSize, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Patients</h1>

      <Input
        icon={icons.search}
        placeholder="Search by name or phone"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        className="max-w-xs"
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Date of birth</th>
              <th className="px-4 py-3">Phone</th>
            </tr>
          </thead>
          <tbody>
            {result?.items.map((patient) => (
              <tr key={patient.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{patient.fullName}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{patient.dateOfBirth}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{patient.phoneNumber}</td>
              </tr>
            ))}
            {result?.items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No patients found.
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

export default function PatientsPage() {
  return (
    <RequireAuth roles={["Admin", "Receptionist", "Doctor"]} crumbs={[{ label: "Patients" }]}>
      <PatientsContent />
    </RequireAuth>
  );
}
