"use client";

import Link from "next/link";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { EcgTrace } from "@/components/landing/EcgTrace";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });
const body = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono-ui", weight: ["400", "500"] });

/**
 * Shared split-screen scaffold for every auth page (login, register, MFA challenge) — carries
 * the same design tokens and heartbeat signature as the landing page, so the sign-in flow reads
 * as a continuation of the brand rather than a generic bolted-on app shell.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable} font-[family-name:var(--font-body)]`}>
      <div
        className="flex min-h-screen"
      >
        {/* LEFT: brand panel */}
        <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-[var(--ink)] px-12 py-10 text-[var(--paper)] lg:flex">
          <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold">
            <FontAwesomeIcon icon={icons.brand} className="text-[var(--coral)]" />
            Hospital Appointment System
          </Link>

          <div>
            <p className="font-[family-name:var(--font-mono-ui)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--coral)]">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-sm font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.1] tracking-tight">
              {title}
            </h1>
            <p className="mt-4 max-w-sm text-[var(--paper)]/70">{subtitle}</p>
            <div className="mt-8 max-w-xs text-[var(--teal)]">
              <EcgTrace className="h-8 w-full opacity-80" />
            </div>
          </div>

          <p className="font-[family-name:var(--font-mono-ui)] text-xs tracking-wide text-[var(--paper)]/50">
            4 role-based portals · 15-min access tokens · TOTP 2FA
          </p>
        </div>

        {/* RIGHT: form panel */}
        <div className="flex flex-1 flex-col justify-center bg-[var(--paper)] px-6 py-16 text-[var(--ink)] sm:px-12">
          <div className="mx-auto w-full max-w-sm">
            <Link href="/" className="mb-8 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold lg:hidden">
              <FontAwesomeIcon icon={icons.brand} className="text-[var(--teal)]" />
              Hospital Appointment System
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
