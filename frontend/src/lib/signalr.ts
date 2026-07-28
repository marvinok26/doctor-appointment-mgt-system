import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

let connection: signalR.HubConnection | null = null;

/**
 * WebSockets can't carry an Authorization header, so the JWT rides along as an
 * access_token query param instead (Program.cs on the backend only honors that param
 * for requests under /hubs/appointments, nowhere else).
 */
export function getAppointmentHubConnection(): signalR.HubConnection {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/appointments`, {
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect()
    // Critical: the SignalR client's default logger calls console.error() on every failed
    // negotiate/reconnect attempt (e.g. a 401 while the token is briefly stale). Next.js's dev
    // overlay treats any console.error as a blocking full-screen error — with the default log
    // level, a single expected reconnect failure was enough to block the entire page, which is
    // exactly what looked like "unable to sign in." Errors are still visible in the browser
    // console for real debugging; they just don't hijack the UI anymore.
    .configureLogging(signalR.LogLevel.Critical)
    .build();

  connection.onreconnecting(() => {
    // Expected during token refresh/network blips — intentionally silent (see above).
  });

  return connection;
}

/**
 * Must be called on logout (and on the "session expired" auto-logout path). Without this, the
 * connection singleton's automatic-reconnect loop keeps retrying with a now-empty token after
 * sign-out, spamming 401s from the hub's negotiate endpoint — which surfaced as an unhandled
 * rejection that blocked the login page behind Next's dev error overlay.
 */
export async function stopAppointmentHubConnection(): Promise<void> {
  if (!connection) return;
  try {
    await connection.stop();
  } catch {
    // Already stopped/disconnected — nothing to do.
  }
}
