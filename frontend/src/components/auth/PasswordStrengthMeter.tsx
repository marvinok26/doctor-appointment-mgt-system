"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

const RULES = [
  { test: (v: string) => v.length >= 10, label: "At least 10 characters" },
  { test: (v: string) => /[A-Z]/.test(v), label: "An uppercase letter" },
  { test: (v: string) => /[a-z]/.test(v), label: "A lowercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "A digit" },
  { test: (v: string) => /[^a-zA-Z0-9]/.test(v), label: "A special character" },
];

const LEVEL_COLOR = ["#e2e8f0", "var(--coral)", "var(--coral)", "#f5b942", "#f5b942", "var(--teal)"];
const LEVEL_LABEL = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];

/** Scored against the same rules the backend enforces (RegisterCommandValidator), so the meter never promises something the API will then reject. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const passed = RULES.map((rule) => rule.test(password));
  const score = password.length === 0 ? 0 : passed.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {RULES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i < score ? LEVEL_COLOR[score] : "#e2e8f0" }}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-xs font-medium" style={{ color: LEVEL_COLOR[score] }}>
          {LEVEL_LABEL[score]}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--mist)]">
        {RULES.map((rule, i) => (
          <li key={rule.label} className={`flex items-center gap-1.5 ${passed[i] ? "text-[var(--teal)]" : ""}`}>
            {passed[i] ? (
              <FontAwesomeIcon icon={icons.confirm} className="text-[10px]" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full border border-current" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
