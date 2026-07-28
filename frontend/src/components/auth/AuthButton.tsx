"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { ButtonHTMLAttributes } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "coral" | "ghost";
}

export function AuthButton({ loading, variant = "coral", className = "", children, disabled, ...rest }: AuthButtonProps) {
  const styles =
    variant === "coral"
      ? "bg-[var(--coral)] text-white shadow-[0_12px_30px_-12px_rgba(255,90,69,0.55)] hover:scale-[1.01]"
      : "border border-[var(--ink)]/15 text-[var(--ink)] hover:bg-[var(--ink)]/5";

  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <FontAwesomeIcon icon={icons.spinner} className="animate-spin" />}
      {children}
    </button>
  );
}
