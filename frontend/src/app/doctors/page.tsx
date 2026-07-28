"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api, ApiError } from "@/lib/api-client";
import { icons } from "@/lib/icons";
import type { Doctor, PagedResult } from "@/types/api";

function CreateDoctorForm({ onCreated }: { onCreated: () => void }) {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", fullName: "", temporaryPassword: "", specialty: "", licenseNumber: "", bio: "" });

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/v1/doctors", form);
      notify("Doctor account created.", "success");
      setForm({ email: "", fullName: "", temporaryPassword: "", specialty: "", licenseNumber: "", bio: "" });
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? Object.values(err.fieldErrors).flat().join(" ") || err.message : "Unable to create doctor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button icon={icons.add} onClick={() => setOpen(true)}>
        Add doctor
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">New doctor account</h2>
      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <Input
          label="Email"
          type="email"
          required
          icon={icons.email}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Specialty"
          required
          icon={icons.specialty}
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        />
        <Input
          label="License number"
          required
          icon={icons.license}
          value={form.licenseNumber}
          onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
        />
        <Input
          label="Temporary password"
          type="password"
          required
          icon={icons.password}
          value={form.temporaryPassword}
          onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })}
        />
      </div>
      <div className="mt-3">
        <RichTextEditor
          label="Bio (optional)"
          value={form.bio}
          onChange={(html) => setForm({ ...form, bio: html })}
          placeholder="A short professional bio shown on the public doctor listing..."
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={onSubmit} loading={submitting}>
          Create
        </Button>
      </div>
    </div>
  );
}

function DoctorsContent() {
  const { hasRole } = useAuth();
  const [result, setResult] = useState<PagedResult<Doctor> | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    api.get<PagedResult<Doctor>>("/api/v1/doctors", { page: 1, pageSize: 50, specialty: search || undefined, activeOnly: true }).then(setResult);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Doctors</h1>
        {hasRole("Admin") && <CreateDoctorForm onCreated={load} />}
      </div>

      <Input icon={icons.search} placeholder="Filter by specialty" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result?.items.map((doctor) => (
          <div key={doctor.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-500/10">
                <FontAwesomeIcon icon={icons.doctors} />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Dr. {doctor.fullName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{doctor.specialty}</p>
              </div>
            </div>
            {doctor.bio && (
              <div
                className="prose prose-sm mt-3 max-w-none text-slate-500 dark:prose-invert dark:text-slate-400"
                // Safe here: Bio is only ever written by Admins through RichTextEditor's Tiptap
                // schema (bold/italic/lists only), never taken from public/patient-supplied input.
                dangerouslySetInnerHTML={{ __html: doctor.bio }}
              />
            )}
          </div>
        ))}
        {result?.items.length === 0 && <p className="text-sm text-slate-400">No doctors found.</p>}
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <RequireAuth crumbs={[{ label: "Doctors" }]}>
      <DoctorsContent />
    </RequireAuth>
  );
}
