# Hospital Appointment Management System

ASP.NET Core 9-style (built on .NET 10, the installed SDK) Web API + Next.js frontend, built from
the "Hospital Appointment Management System" project on Marvin Okongo's CV. Clean Architecture,
JWT auth with idle-timeout auto-logout, MFA, RBAC, SignalR real-time updates, Redis caching, and
rate limiting/CORS/CSRF protections, per the System Principles brief this was built against.

A public marketing landing page (`/`) fronts the product; every other route requires sign-in and
is scoped by role — Admin, Doctor, Receptionist, Patient each see a different portal, not a single
shared screen with hidden buttons.

### Portals
- **Landing** (`/`, no auth) — the pitch: hero, feature walkthroughs, one card per role, a security
  checklist, login/register CTAs. Authenticated visitors are redirected straight to their dashboard.
- **Patient portal** — book/cancel appointments against real open slots, see live status, get email +
  in-app reminders, manage their own MFA.
- **Doctor / Receptionist portals** — schedule management, patient directory lookup, appointment
  status workflow (confirm → check in → complete), same real-time updates.
- **Admin portal** (`/admin`) — system overview (accounts by role, appointments by status, today's
  volume — one API call), account directory with lock/unlock, and a full audit-log viewer.
- **Notifications** (`/notifications`, every role) — persisted, paginated, mark-as-read; the bell in
  the header shows a live unread count pushed over the same SignalR connection as appointment updates.

## Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 10 Web API, EF Core, SQL Server, Redis, SignalR, MediatR, FluentValidation |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS + Font Awesome |
| Auth | ASP.NET Core Identity, JWT access + rotating refresh tokens, TOTP MFA (Otp.NET) |
| Infra | Docker Compose (API, SQL Server, Redis, smtp4dev, frontend) |

## Repository layout

```
backend/
  src/HospitalSystem.Domain          entities, enums, repository interfaces — no external deps
  src/HospitalSystem.Application     CQRS commands/queries (MediatR), validators, DTOs, interfaces
  src/HospitalSystem.Infrastructure  EF Core, Identity, JWT/Redis/Email/Audit service implementations
  src/HospitalSystem.Api             controllers, SignalR hub, middleware, Program.cs composition root
  tests/HospitalSystem.Tests         unit tests (no DB/Redis required)
frontend/                            Next.js app
docker-compose.yml                   API + SQL Server + Redis + smtp4dev + frontend
```

## Running it

```bash
# 1. Backend + infra (SQL Server, Redis, smtp4dev, API) — needs Docker
docker compose up --build

# 2. Or run the API locally against dockerized dependencies:
docker compose up -d sqlserver redis smtp4dev
cd backend && dotnet run --project src/HospitalSystem.Api

# 3. Frontend
cd frontend && npm install && npm run dev   # http://localhost:3000
```

Migrations run automatically on startup in Development (`DataSeeder.SeedAsync`), which also seeds
the `Admin`/`Doctor`/`Receptionist`/`Patient` roles, an admin account, and one sample doctor.
Default seeded admin: `admin@hospitalsystem.local` / `ChangeMe!2026Secure` (override via
`Seed__AdminEmail` / `Seed__AdminPassword` — change these before any non-local deployment).

> **Note on this build environment:** Docker's daemon wasn't reachable in the sandbox this was
> built in, so `docker compose up` and the full request/response cycle against a real SQL
> Server/Redis instance haven't been exercised end-to-end here. Both the backend (`dotnet build`,
> `dotnet test`, `dotnet ef migrations add`) and frontend (`npm run build`, `npm run lint`) were
> verified directly. Run `docker compose up --build` locally to do the full integration check.

## How each System Principle is satisfied

### 1. Consistency
- **Naming**: PascalCase C# types/members, camelCase TS, plural-noun REST resources
  (`/appointments`, `/doctors`, `/patients`) throughout.
- **Patterns**: every write/read goes through a MediatR command/query handler; every list endpoint
  takes the same `PaginationQuery` (`page`, `pageSize`, `sortBy`, `sortDir`) and returns the same
  `PagedResult<T>` envelope (`Application/Common/Models`).
- **Icons**: Font Awesome exclusively (`frontend/src/lib/icons.ts` is the single source of truth
  mapping concept → glyph, including brand icons for the footer's social links) — no emojis, no
  ad-hoc inline SVGs.
- **Colors**: Tailwind's default palette used consistently — sky-600 for primary actions, semantic
  status colors centralized in `components/StatusBadge.tsx` (amber/blue/purple/emerald/gray/red for
  Requested/Confirmed/CheckedIn/Completed/Cancelled/NoShow) rather than re-picked per page.
- **Styling**: Tailwind CSS only, no separate CSS files/CSS-in-JS beyond the generated `globals.css`.

### 2. Simplicity
- Core use cases only: book/confirm/check-in/complete/cancel an appointment, browse doctors and
  their real availability, staff directory lookup — no speculative features.
- `AppointmentStatusTransitions` (Application layer) is a single explicit state machine, so illegal
  transitions (e.g. re-opening a Cancelled appointment) are rejected in one place, not scattered
  `if` checks.
- One booking modal covers both the patient self-service flow and the staff-books-for-patient flow,
  rather than two parallel implementations.

### 3. Security
- **Authentication**: JWT access tokens (15 min) signed with a symmetric key from configuration/
  environment (never hardcoded), issued by `POST /auth/login`.
- **Authorization**: ASP.NET Core `[Authorize(Roles = ...)]` per endpoint; the four roles (Admin,
  Doctor, Receptionist, Patient) are enforced both at the controller level and again inside
  `AppointmentsController` (a Patient can only ever see/act on their own records, a Doctor only
  their own schedule — resolved server-side from the JWT's user id, never trusted from a query
  param).
- **MFA**: TOTP (RFC 6238) via Otp.NET — `/auth/mfa/setup` → `/auth/mfa/confirm` to enable,
  `/auth/mfa/verify` gates login for any account with MFA on.
- **Input validation**: FluentValidation validators run in a MediatR pipeline behavior
  (`ValidationBehavior`) before any handler executes — e.g. appointment start must be in the
  future, end after start, duration ≤ 4 hours; passwords require upper/lower/digit/symbol/10+ chars.
- **Rate limiting**: three ASP.NET Core `RateLimiter` policies (`Api/Extensions/RateLimitingExtensions.cs`)
  — a global fixed-window limiter per IP (300/min, the DDoS backstop), a tighter sliding-window
  `"auth"` policy per IP on login/register/refresh/MFA (10/min, blunts credential stuffing), and an
  `"api"` policy per authenticated user (120/min) on the CRUD controllers.

### 4. Performance
- **Caching**: doctor listings and per-doctor/per-day availability are cached in Redis
  (`ICacheService`, 5 min / 2 min TTLs) and invalidated on the writes that would change them
  (`RemoveByPrefixAsync` on appointment creation/doctor creation).
- **Pagination**: every list endpoint is paginated server-side (`PagedResult<T>`); the frontend
  never fetches an unbounded collection.
- **Minimized payloads**: DTOs are hand-shaped projections (`AppointmentDto` includes the doctor's
  name/specialty inline rather than forcing a follow-up `/doctors/{id}` call); dashboard stat tiles
  request `pageSize=1` just to read `totalCount` cheaply.
- **Reduced round trips**: booking a slot is one `POST /appointments` call; the SignalR push means
  other connected staff/patient clients see the change without polling.

## RESTful conventions followed
- Plural nouns: `/api/v1/appointments`, `/api/v1/doctors`, `/api/v1/patients`.
- Versioned: every route is under `/api/v{version}/...` (`Asp.Versioning`).
- Filtering/sorting/pagination via query string on every list endpoint.
- Status codes used deliberately: `201 Created` (with `Location`) on resource creation, `204 No
  Content` on logout/MFA-confirm, `400` for validation, `401` for missing/expired auth, `403` for
  role mismatches server-detects post-hoc, `404` for missing resources, `409` for scheduling
  conflicts, `429` for rate-limit rejections, `5xx` mapped uniformly by
  `Middleware/ExceptionHandlingMiddleware.cs` to a single `{ title, status, errors? }` JSON shape the
  frontend's `ApiError` class understands everywhere.

## Idle-timeout auto-logout (access tokens)
- Access tokens expire in 15 minutes and live only in JS memory (`frontend/src/lib/api-client.ts`) —
  never localStorage, so an XSS payload reading storage can't exfiltrate one.
- The refresh token is an httpOnly, `Secure`, `SameSite=Strict` cookie, scoped to `/api/v1/auth`,
  with both an absolute lifetime (7 days) and a **sliding idle window (30 minutes)** —
  `TokenService.ValidateAndRotateAsync` rejects the refresh once `LastUsedAtUtc + 30min` has passed,
  regardless of the absolute expiry. That's the actual "log out inactive users" mechanism: an
  abandoned tab's next silent-refresh attempt (triggered by the API client on any 401) simply fails,
  and `AuthContext` redirects to `/login`.
- Refresh tokens rotate on every use (old one revoked, new one issued) so a leaked, already-used
  refresh token can't be replayed.

## CORS, CSRF, and the rest of the "Security" list
- **CORS**: a named policy allow-lists only the configured frontend origin(s)
  (`Cors:AllowedOrigins`) with `AllowCredentials()` — required for the cookie to flow, and
  deliberately not a wildcard, since wildcard + credentials is disallowed by browsers anyway and
  would be unsafe if it weren't.
- **CSRF**: the refresh cookie is `SameSite=Strict`, so a cross-site page cannot trigger a
  legitimate `/auth/refresh` call in the first place (browsers withhold the cookie on cross-site
  requests entirely). Every other endpoint is authenticated via a bearer token in an `Authorization`
  header — headers are never auto-attached by the browser the way cookies are, so classic CSRF
  (which relies on ambient credential attachment) doesn't apply to them.
- **Parameterized queries / ORM safeguards**: all data access goes through EF Core LINQ (no raw SQL
  string concatenation anywhere in the codebase), which parameterizes automatically.
- **Firewalls / VPNs**: these are network-perimeter controls, not application code, so they're not
  "implemented" inside this repo — they're the operator's responsibility at deploy time. For a real
  deployment:
  - Put the API and frontend behind a reverse proxy/WAF (e.g. Azure Front Door, an nginx ingress
    with ModSecurity, or a cloud LB with a security group) that terminates TLS and only forwards
    ports 443/80.
  - Firewall the database and Redis containers so only the API's container/subnet can reach them —
    in `docker-compose.yml` this is already true by default (SQL Server/Redis aren't exposed
    outside the `hospital-net` bridge network in a production compose file; the `1433`/`6379`
    host-port mappings here exist only for local development convenience and should be removed
    before deploying anywhere reachable).
  - Restrict the Admin-only endpoints (`POST /doctors`, seed credentials) to an internal
    network/VPN or an IP allow-list at the reverse-proxy layer, on top of the RBAC check the API
    already does.
- **Audit logging**: every login, failed login, logout, token refresh, MFA event, and
  create/update on an appointment writes an `AuditLog` row (who, IP, user agent, before/after JSON)
  via `IAuditService`.

## Tests
```bash
cd backend && dotnet test
```
17 unit tests cover the appointment status state machine, booking validation rules, and the JWT/MFA
challenge token round-trip in isolation (no database or Redis required — these run anywhere).
