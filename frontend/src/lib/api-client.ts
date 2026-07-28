import type { ApiErrorShape } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * The access token lives only in memory (this module-level variable), never in
 * localStorage/sessionStorage — that keeps it out of reach of an XSS payload reading
 * storage. The refresh token never touches JS at all: it's an httpOnly cookie the browser
 * attaches automatically to /auth/refresh. Losing the tab reloads the page and re-runs the
 * silent-refresh-on-load flow in AuthContext, which is the intended tradeoff.
 */
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function registerSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorShape | null,
  ) {
    super(body?.title ?? `Request failed with status ${status}`);
  }

  get fieldErrors(): Record<string, string[]> {
    return this.body?.errors ?? {};
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
  skipAuthRetry?: boolean;
}

function buildUrl(path: string, searchParams?: RequestOptions["searchParams"]) {
  const url = new URL(`${API_URL}${path}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<{ status: number; data: T | undefined }> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(buildUrl(path, options.searchParams), {
    method: options.method ?? "GET",
    headers,
    credentials: "include", // sends the httpOnly refresh cookie on same-site requests
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // 204 No Content and other empty bodies never call response.json() — avoids a "Unexpected end of JSON input" throw.
  const hasBody = response.status !== 204 && response.headers.get("content-length") !== "0";
  const data = hasBody ? ((await response.json().catch(() => undefined)) as T | undefined) : undefined;

  return { status: response.status, data };
}

async function tryRefresh(): Promise<boolean> {
  try {
    const { status, data } = await rawRequest<{ accessToken: string }>("/api/v1/auth/refresh", {
      method: "POST",
      skipAuthRetry: true,
    });
    if (status === 200 && data?.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
  } catch {
    // fall through to failure below
  }
  return false;
}

/**
 * Central request function every page/hook goes through. Maps HTTP status codes to the
 * behavior the frontend needs: 401 triggers exactly one silent refresh-and-retry (the
 * mechanism behind auto-logout — once the refresh token itself has gone idle-timeout, the
 * retry also 401s and we log the user out); other 4xx/5xx surface as a typed ApiError.
 */
export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  let { status, data } = await rawRequest<T>(path, options);

  if (status === 401 && !options.skipAuthRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      ({ status, data } = await rawRequest<T>(path, options));
    } else {
      setAccessToken(null);
      onSessionExpired?.();
      throw new ApiError(401, { title: "Your session has expired. Please sign in again.", status: 401 });
    }
  }

  if (status >= 200 && status < 300) {
    return data as T;
  }

  if (status >= 300 && status < 400) {
    // 3xx redirects are handled transparently by fetch itself; reaching here means a non-followable redirect.
    throw new ApiError(status, { title: "Unexpected redirect.", status });
  }

  throw new ApiError(status, (data as ApiErrorShape) ?? { title: "Request failed.", status });
}

export const api = {
  get: <T>(path: string, searchParams?: RequestOptions["searchParams"]) =>
    apiRequest<T>(path, { method: "GET", searchParams }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
