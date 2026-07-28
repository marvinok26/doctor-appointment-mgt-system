"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { icons } from "@/lib/icons";
import type { Doctor, FreeSlot, PagedResult, Patient } from "@/types/api";

interface BookAppointmentModalProps {
  onClose: () => void;
  onBooked: () => void;
}

export function BookAppointmentModal({ onClose, onBooked }: BookAppointmentModalProps) {
  const { hasRole } = useAuth();
  const { notify } = useToast();
  const isStaff = hasRole("Admin", "Receptionist");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");

  useEffect(() => {
    api.get<PagedResult<Doctor>>("/api/v1/doctors", { page: 1, pageSize: 100, activeOnly: true }).then((r) => setDoctors(r.items));
  }, []);

  useEffect(() => {
    if (!doctorId || !date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale slots when the selection is incomplete
      setSlots([]);
      return;
    }
    api.get<FreeSlot[]>(`/api/v1/doctors/${doctorId}/available-slots`, { date }).then(setSlots);
    setSelectedSlot(null);
  }, [doctorId, date]);

  useEffect(() => {
    if (!isStaff || patientSearch.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results once the search term is too short
      setPatients([]);
      return;
    }
    const handle = setTimeout(() => {
      api.get<PagedResult<Patient>>("/api/v1/patients", { page: 1, pageSize: 10, search: patientSearch }).then((r) => setPatients(r.items));
    }, 300);
    return () => clearTimeout(handle);
  }, [patientSearch, isStaff]);

  const canSubmit = doctorId && selectedSlot && reason.trim().length > 0 && (!isStaff || patientId);

  const onSubmit = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/v1/appointments", {
        doctorId,
        patientId: isStaff ? patientId : undefined,
        scheduledStartUtc: selectedSlot.startUtc,
        scheduledEndUtc: selectedSlot.endUtc,
        reason,
      });
      notify("Appointment booked.", "success");
      onBooked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Book an appointment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <FontAwesomeIcon icon={icons.close} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        )}

        <div className="flex flex-col gap-4">
          {isStaff && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Patient</label>
              <Input icon={icons.search} placeholder="Search by name or phone" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
              {patients.length > 0 && (
                <ul className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => {
                          setPatientId(p.id);
                          setPatientSearch(p.fullName);
                          setPatients([]);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {p.fullName} · {p.phoneNumber}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Doctor</label>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />

          {doctorId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Available slots</label>
              {slots.length === 0 ? (
                <p className="text-sm text-slate-400">No free slots on this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startUtc}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-2 py-1.5 text-xs ${
                        selectedSlot?.startUtc === slot.startUtc
                          ? "border-sky-600 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                          : "border-slate-300 text-slate-600 hover:border-sky-400 dark:border-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {new Date(slot.startUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Input label="Reason for visit" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual checkup" />

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit} loading={submitting} disabled={!canSubmit}>
              Book appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
