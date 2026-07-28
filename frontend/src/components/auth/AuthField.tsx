"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { icons } from "@/lib/icons";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: IconDefinition;
  error?: string;
}

/**
 * Brand-toned input for the auth flow — teal focus ring, coral error state, matches AuthShell.
 * type="password" gets a show/hide eye toggle automatically (never rendered as a separate prop —
 * the toggle owns visibility state internally so callers just pass type="password" as usual).
 * `required` renders a coral asterisk next to the label per the form-validation convention.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, icon, error, id, type, required, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--ink)]/80">
        {label}
        {required && (
          <span className="ml-0.5 text-[var(--coral)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <FontAwesomeIcon icon={icon} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mist)]" />
        <input
          ref={ref}
          id={inputId}
          type={isPassword ? (visible ? "text" : "password") : type}
          required={required}
          aria-required={required}
          className={`w-full rounded-xl border bg-white py-2.5 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--mist)]/60 transition-colors focus:outline-none focus:ring-2 ${
            isPassword ? "pr-10" : "pr-3.5"
          } ${
            error
              ? "border-[var(--coral)]/50 focus:border-[var(--coral)] focus:ring-[var(--coral)]/20"
              : "border-[var(--ink)]/12 focus:border-[var(--teal)] focus:ring-[var(--teal)]/20"
          }`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--mist)] hover:text-[var(--ink)]"
          >
            <FontAwesomeIcon icon={visible ? icons.hidePassword : icons.showPassword} />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[var(--coral)]">{error}</p>}
    </div>
  );
});
