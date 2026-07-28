"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { icons } from "@/lib/icons";
import type { MfaSetup } from "@/types/api";

function MfaSetupContent() {
  const router = useRouter();
  const { notify } = useToast();
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const beginSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<MfaSetup>("/api/v1/auth/mfa/setup");
      setSetup(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to start MFA setup.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/v1/auth/mfa/confirm", { code });
      notify("Two-factor authentication enabled.", "success");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={icons.mfa} className="text-2xl text-sky-600" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Two-factor authentication</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

      {!setup ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Add an extra layer of security to your account using an authenticator app (Google Authenticator, Authy, etc.).
          </p>
          <Button onClick={beginSetup} loading={loading}>
            Start setup
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            In your authenticator app, add an account manually using this secret key:
          </p>
          <code className="break-all rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100">{setup.secret}</code>
          <p className="text-xs text-slate-400">Or use this setup URI: {setup.otpAuthUri}</p>

          <Input label="Enter the 6-digit code to confirm" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          <Button onClick={confirm} loading={loading} disabled={code.length !== 6}>
            Confirm and enable
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MfaSettingsPage() {
  return (
    <RequireAuth crumbs={[{ label: "Two-Factor Authentication" }]}>
      <MfaSetupContent />
    </RequireAuth>
  );
}
