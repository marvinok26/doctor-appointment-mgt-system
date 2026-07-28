"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth, postLoginRoute } from "@/lib/auth-context";
import { icons } from "@/lib/icons";
import { EcgTrace } from "@/components/landing/EcgTrace";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });
const body = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono-ui", weight: ["400", "500"] });

const roles = [
  {
    icon: icons.dashboard,
    title: "Admin",
    blurb: "The control room.",
    points: ["Live stats across every doctor, patient and appointment", "Manage staff accounts and lock out compromised logins", "Full audit trail — who did what, from where, when"],
  },
  {
    icon: icons.doctors,
    title: "Doctor",
    blurb: "The schedule, without the clipboard.",
    points: ["Today's queue with real-time check-in updates", "Set weekly availability once, let booking respect it", "Close the loop: confirm, check in, complete — one click each"],
  },
  {
    icon: icons.patients,
    title: "Receptionist",
    blurb: "Book for anyone, in seconds.",
    points: ["Search the patient directory mid-call", "See every doctor's open slots before you ask them to hold", "Handle walk-ins and phone bookings the same way patients do"],
  },
  {
    icon: icons.appointments,
    title: "Patient",
    blurb: "No phone tag required.",
    points: ["Book a real open slot — not a request that waits for a callback", "Get a reminder before the visit, not after you've missed it", "See exactly where every appointment stands, live"],
  },
];

const features = [
  {
    eyebrow: "Booking",
    title: "Book in seconds, not phone calls",
    body: "Patients see a doctor's actual open slots and reserve one directly. No back-and-forth, no double-booked rooms — the system checks for conflicts the moment a slot is picked.",
    mock: <BookingMock />,
  },
  {
    eyebrow: "Live status",
    title: "Every appointment, tracked in real time",
    body: "Requested, confirmed, checked in, completed — status changes push instantly to the doctor, the front desk, and the patient over a live connection. No one's refreshing a page to find out what happened.",
    mock: <StatusMock />,
  },
  {
    eyebrow: "Reminders",
    title: "Reminders that actually go out",
    body: "A background job sweeps for confirmed appointments in the next 24 hours and emails the patient automatically — off the critical path, so booking never waits on a mail server.",
    mock: <ReminderMock />,
  },
];

const securityPoints = [
  "Role-based access control, enforced per portal and per record",
  "Time-based one-time-password multi-factor authentication",
  "15-minute access tokens with idle-timeout auto sign-out",
  "Rate limiting on login, and on every authenticated endpoint",
  "A complete audit trail of every sensitive action taken",
];

function BookingMock() {
  const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  return (
    <div className="rounded-2xl border border-[var(--mist)]/20 bg-white p-5 shadow-[0_20px_50px_-25px_rgba(16,24,39,0.35)]">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--mist)]">Dr. Wanjiru · General Medicine · Aug 3</p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((s, i) => (
          <div
            key={s}
            className={`rounded-lg border px-2 py-2 text-center text-sm ${
              i === 2 ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)] font-medium" : "border-[var(--mist)]/25 text-[var(--ink)]/70"
            }`}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusMock() {
  const rows = [
    { name: "A. Otieno", status: "Confirmed", color: "bg-sky-100 text-sky-700" },
    { name: "R. Mwangi", status: "Checked In", color: "bg-purple-100 text-purple-700" },
    { name: "S. Njeri", status: "Completed", color: "bg-emerald-100 text-emerald-700" },
  ];
  return (
    <div className="rounded-2xl border border-[var(--mist)]/20 bg-white p-5 shadow-[0_20px_50px_-25px_rgba(16,24,39,0.35)]">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between border-b border-[var(--mist)]/10 py-2.5 last:border-0">
          <span className="text-sm text-[var(--ink)]/80">{r.name}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.color}`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

function ReminderMock() {
  return (
    <div className="rounded-2xl border border-[var(--mist)]/20 bg-white p-5 shadow-[0_20px_50px_-25px_rgba(16,24,39,0.35)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--teal)]/10 text-[var(--teal)]">
          <FontAwesomeIcon icon={icons.notifications} />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">Appointment reminder</p>
          <p className="mt-0.5 text-sm text-[var(--mist)]">Your visit with Dr. Wanjiru is tomorrow at 10:00.</p>
          <p className="mt-2 font-[family-name:var(--font-mono-ui)] text-[11px] text-[var(--mist)]/70">sent 24h before · auto</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace(postLoginRoute(user));
  }, [loading, user, router]);

  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable} font-[family-name:var(--font-body)]`}>
      <div
        className="bg-[var(--paper)] text-[var(--ink)]"
      >
        {/* NAV */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold">
            <FontAwesomeIcon icon={icons.brand} className="text-[var(--teal)]" />
            Hospital Appointment System
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[var(--ink)]/70 md:flex">
            <a href="#features" className="hover:text-[var(--ink)]">Features</a>
            <a href="#roles" className="hover:text-[var(--ink)]">Roles</a>
            <a href="#security" className="hover:text-[var(--ink)]">Security</a>
          </nav>
          <Link
            href="/login"
            className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition-transform hover:scale-[1.03]"
          >
            Log in
          </Link>
        </header>

        {/* HERO */}
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-12 text-center sm:pt-20">
          <p className="landing-rise font-[family-name:var(--font-mono-ui)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--coral)]">
            For clinics &amp; hospitals
          </p>
          <h1 className="landing-rise mt-5 font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            The heartbeat of
            <br />a well-run clinic.
          </h1>

          <div className="landing-rise mx-auto mt-8 max-w-md text-[var(--teal)]" style={{ animationDelay: "0.15s" }}>
            <EcgTrace className="h-10 w-full" />
          </div>

          <p className="landing-rise mx-auto mt-6 max-w-xl text-lg text-[var(--mist)]" style={{ animationDelay: "0.1s" }}>
            One system for booking, staff, and records — real-time, secure, and built for every
            seat in the hospital. No patient falls through the cracks; no seat waits on a phone
            call.
          </p>

          <div className="landing-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/login"
              className="w-full rounded-full bg-[var(--coral)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_-10px_rgba(255,90,69,0.6)] transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Log in to your portal
            </Link>
            <Link
              href="/register"
              className="w-full rounded-full border border-[var(--ink)]/15 px-7 py-3.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/5 sm:w-auto"
            >
              Create a patient account
            </Link>
          </div>

          <p className="landing-rise mt-10 font-[family-name:var(--font-mono-ui)] text-xs tracking-wide text-[var(--mist)]" style={{ animationDelay: "0.3s" }}>
            4 role-based portals · 15-min access tokens · TOTP 2FA · live via WebSocket
          </p>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-[family-name:var(--font-mono-ui)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--coral)]">Features</p>
          <h2 className="mt-3 max-w-lg font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Everything the front desk, the doctor, and the patient need
          </h2>

          <div className="mt-16 flex flex-col gap-20">
            {features.map((f, i) => (
              <div key={f.title} className={`flex flex-col items-center gap-10 md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-mono-ui)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--teal)]">{f.eyebrow}</p>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight sm:text-3xl">{f.title}</h3>
                  <p className="mt-4 max-w-md text-[var(--mist)]">{f.body}</p>
                </div>
                <div className="w-full flex-1">{f.mock}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ROLES */}
        <section id="roles" className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-[family-name:var(--font-mono-ui)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--coral)]">Roles</p>
          <h2 className="mt-3 max-w-lg font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Built for every seat in the clinic
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div key={role.title} className="rounded-2xl border border-[var(--ink)]/8 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--teal)]/10 text-[var(--teal)]">
                  <FontAwesomeIcon icon={role.icon} />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium">{role.title}</h3>
                <p className="mt-1 text-sm text-[var(--coral)]">{role.blurb}</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {role.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-[var(--mist)]">
                      <FontAwesomeIcon icon={icons.confirm} className="mt-0.5 shrink-0 text-[var(--teal)]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" className="bg-[var(--ink)] py-24 text-[var(--paper)]">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="font-[family-name:var(--font-mono-ui)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--coral)]">Security</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              Built in, not bolted on
            </h2>
            <ul className="mx-auto mt-10 flex max-w-xl flex-col gap-4 text-left">
              {securityPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 rounded-xl border border-white/10 px-5 py-4">
                  <FontAwesomeIcon icon={icons.mfa} className="mt-0.5 shrink-0 text-[var(--coral)]" />
                  <span className="text-[var(--paper)]/85">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Ready to give every appointment a pulse?
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-full bg-[var(--coral)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_-10px_rgba(255,90,69,0.6)] transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="w-full rounded-full border border-[var(--ink)]/15 px-7 py-3.5 text-sm font-medium hover:bg-[var(--ink)]/5 sm:w-auto"
            >
              Create a patient account
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[var(--ink)]/8 px-6 py-8 text-sm text-[var(--mist)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <span>&copy; {new Date().getFullYear()} Hospital Appointment System</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-[var(--ink)]">
                <FontAwesomeIcon icon={icons.github} size="lg" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-[var(--ink)]">
                <FontAwesomeIcon icon={icons.linkedin} size="lg" />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="hover:text-[var(--ink)]">
                <FontAwesomeIcon icon={icons.twitter} size="lg" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
