"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth, isApiError } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton } from "@/components/auth/AuthButton";
import { icons } from "@/lib/icons";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, verifyMfa } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await login(values.email, values.password);
      if (result.mfaRequired && result.challengeToken) {
        setChallengeToken(result.challengeToken);
      } else if (result.user) {
        router.push("/dashboard");
      }
    } catch (err) {
      setServerError(isApiError(err) ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyMfa = async () => {
    if (!challengeToken) return;
    setServerError(null);
    setSubmitting(true);
    try {
      const user = await verifyMfa(challengeToken, mfaCode);
      if (user) router.push("/dashboard");
    } catch (err) {
      setServerError(isApiError(err) ? err.message : "Invalid authentication code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={challengeToken ? "One more step." : "Sign in to keep the queue moving."}
      subtitle={
        challengeToken
          ? "Enter the code from your authenticator app to finish signing in."
          : "Your schedule, your patients, your dashboard — right where you left them."
      }
    >
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight">
        {challengeToken ? "Verify it's you" : "Sign in"}
      </h2>

      {serverError && (
        <div className="mt-5 rounded-xl border border-[var(--coral)]/20 bg-[var(--coral)]/5 px-4 py-3 text-sm text-[var(--coral)]">
          {serverError}
        </div>
      )}

      {challengeToken ? (
        <div className="mt-6 flex flex-col gap-4">
          <AuthField
            label="Authentication code"
            icon={icons.mfa}
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
          />
          <AuthButton onClick={onVerifyMfa} loading={submitting} disabled={mfaCode.length !== 6}>
            Verify and continue
          </AuthButton>
          <button
            type="button"
            onClick={() => setChallengeToken(null)}
            className="text-center text-sm text-[var(--mist)] hover:text-[var(--ink)]"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <AuthField label="Email" type="email" required icon={icons.email} error={errors.email?.message} {...register("email")} />
          <AuthField label="Password" type="password" required icon={icons.password} error={errors.password?.message} {...register("password")} />
          <AuthButton type="submit" loading={submitting} className="mt-2">
            Sign in
          </AuthButton>
        </form>
      )}

      {!challengeToken && (
        <p className="mt-8 flex items-center gap-2 text-sm text-[var(--mist)]">
          <FontAwesomeIcon icon={icons.patients} className="text-[var(--teal)]" />
          New patient?{" "}
          <Link href="/register" className="font-medium text-[var(--teal)] hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
