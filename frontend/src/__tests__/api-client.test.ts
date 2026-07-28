import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError, registerSessionExpiredHandler, setAccessToken } from "@/lib/api-client";

function fakeResponse(status: number, body?: unknown): Response {
  const hasBody = body !== undefined;
  return {
    status,
    headers: { get: (name: string) => (name === "content-length" ? (hasBody ? "1" : "0") : null) },
    json: () => (hasBody ? Promise.resolve(body) : Promise.reject(new Error("no body"))),
  } as unknown as Response;
}

describe("apiRequest", () => {
  let sessionExpired: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setAccessToken(null);
    sessionExpired = vi.fn();
    registerSessionExpiredHandler(sessionExpired);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns undefined for a 204 without attempting to parse a body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/v1/auth/logout", { method: "POST" });

    expect(result).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws an ApiError carrying field errors for a 400", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      fakeResponse(400, { title: "Validation failed.", status: 400, errors: { email: ["Enter a valid email address."] } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/v1/auth/register", { method: "POST" })).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: ["Enter a valid email address."] },
    });
  });

  it("does not attempt a refresh when skipAuthRetry is set, on a 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/v1/auth/refresh", { method: "POST", skipAuthRetry: true })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it("silently refreshes once and retries the original request on a 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse(401)) // original request
      .mockResolvedValueOnce(fakeResponse(200, { accessToken: "new-token" })) // refresh
      .mockResolvedValueOnce(fakeResponse(200, { ok: true })); // retried original
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/v1/appointments");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it("logs the user out when the refresh itself also 401s (the idle-timeout path)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse(401)) // original request
      .mockResolvedValueOnce(fakeResponse(401)); // refresh also fails
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/v1/appointments")).rejects.toBeInstanceOf(ApiError);
    expect(sessionExpired).toHaveBeenCalledTimes(1);
  });
});
