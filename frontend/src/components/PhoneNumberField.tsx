"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneNumberFieldProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
  required?: boolean;
  brand?: boolean;
}

/**
 * Country-code selector with flags, search-to-filter, and E.164 formatting/validation baked in
 * (react-phone-number-input) — the complete phone-number contract: display flags, support search,
 * format as E.164, validate per selected country, and store the full international number.
 * `brand` switches the visual tokens to match the auth pages' palette; otherwise it uses the
 * app-wide slate/sky tokens used everywhere else in the dashboard.
 */
export function PhoneNumberField({ label, value, onChange, error, required, brand }: PhoneNumberFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-sm font-medium ${brand ? "text-[var(--ink)]/80" : "text-slate-700 dark:text-slate-200"}`}>
        {label}
        {required && (
          <span className={`ml-0.5 ${brand ? "text-[var(--coral)]" : "text-red-500"}`} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <PhoneInput
        international
        defaultCountry="KE"
        countrySelectProps={{ "aria-label": "Country code" }}
        value={value}
        onChange={onChange}
        className={`phone-field ${brand ? "phone-field-brand" : "phone-field-app"} ${error ? "phone-field-error" : ""}`}
        numberInputProps={{ className: "phone-field-input" }}
      />
      {error && <p className={`text-xs ${brand ? "text-[var(--coral)]" : "text-red-600"}`}>{error}</p>}
    </div>
  );
}
