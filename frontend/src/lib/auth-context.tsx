"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiRequest, ApiError, registerSessionExpiredHandler, setAccessToken } from "@/lib/api-client";
import { stopAppointmentHubConnection } from "@/lib/signalr";
import type { LoginResult, Role, UserProfile } from "@/types/api";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; challengeToken?: string; user?: UserProfile }>;
  verifyMfa: (challengeToken: string, code: string) => Promise<UserProfile | undefined>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

/** Admins land in the admin console; every other role lands on the general dashboard. */
export function postLoginRoute(user: UserProfile): string {
  return user.roles.includes("Admin") ? "/admin" : "/dashboard";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    void stopAppointmentHubConnection();
    router.push("/login");
  }, [router]);

  useEffect(() => {
    registerSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // On first load there's no access token in memory yet (a hard refresh clears it), so we
  // attempt a silent refresh using the httpOnly cookie before deciding the user is logged out.
  // skipAuthRetry is critical here: a guest with no cookie gets a perfectly expected 401, which
  // must NOT be treated as "an active session just expired" (that would force-redirect every
  // first-time visitor — including on public pages like the landing page — straight to /login).
  useEffect(() => {
    (async () => {
      try {
        const refreshResult = await apiRequest<{ accessToken: string }>("/api/v1/auth/refresh", {
          method: "POST",
          skipAuthRetry: true,
        });
        setAccessToken(refreshResult.accessToken);
        // The refresh endpoint only returns a token, not the profile, so fetch it separately
        // isn't available either — instead we decode nothing and rely on a dedicated call.
        const profile = await api.get<UserProfile>("/api/v1/auth/me").catch(() => null);
        if (profile) setUser(profile);
      } catch {
        // No valid session — this is the normal logged-out state, not an error to surface.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResult>("/api/v1/auth/login", { email, password });

    if (result.mfaRequired) {
      return { mfaRequired: true, challengeToken: result.mfaChallengeToken ?? undefined };
    }

    if (result.accessToken && result.user) {
      setAccessToken(result.accessToken);
      setUser(result.user);
    }

    return { mfaRequired: false, user: result.user ?? undefined };
  }, []);

  const verifyMfa = useCallback(async (challengeToken: string, code: string) => {
    const result = await api.post<LoginResult>("/api/v1/auth/mfa/verify", { challengeToken, code });
    if (result.accessToken && result.user) {
      setAccessToken(result.accessToken);
      setUser(result.user);
    }
    return result.user ?? undefined;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      // best-effort revoke; clear local state regardless
    }
    setAccessToken(null);
    setUser(null);
    await stopAppointmentHubConnection();
    router.push("/login");
  }, [router]);

  const hasRole = useCallback((...roles: Role[]) => !!user && roles.some((r) => user.roles.includes(r)), [user]);

  const value = useMemo(
    () => ({ user, loading, login, verifyMfa, logout, hasRole }),
    [user, loading, login, verifyMfa, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
