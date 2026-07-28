import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

// Scored against the exact same rules RegisterCommandValidator enforces on the backend
// (min 10 chars, upper, lower, digit, special) — see PasswordStrengthMeter.tsx's own comment.
describe("PasswordStrengthMeter", () => {
  it("shows nothing rated for an empty password", () => {
    render(<PasswordStrengthMeter password="" />);
    expect(screen.queryByText(/strong|weak|fair|good/i)).not.toBeInTheDocument();
  });

  it("rates a password meeting exactly one rule as very weak", () => {
    // A single lowercase letter satisfies only the "lowercase letter" rule — length, upper,
    // digit, and special all fail, so this is the minimum non-empty score.
    render(<PasswordStrengthMeter password="a" />);
    expect(screen.getByText("Very weak")).toBeInTheDocument();
  });

  it("rates a password meeting length + one character class as weak", () => {
    render(<PasswordStrengthMeter password="lowercaseonly" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("rates a password meeting every rule as strong", () => {
    render(<PasswordStrengthMeter password="Str0ng!Pass2026" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("lists all five rules regardless of pass/fail", () => {
    render(<PasswordStrengthMeter password="abc" />);
    expect(screen.getByText("At least 10 characters")).toBeInTheDocument();
    expect(screen.getByText("An uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("A lowercase letter")).toBeInTheDocument();
    expect(screen.getByText("A digit")).toBeInTheDocument();
    expect(screen.getByText("A special character")).toBeInTheDocument();
  });
});
