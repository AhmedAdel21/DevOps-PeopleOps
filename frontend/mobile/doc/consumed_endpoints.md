# Consumed Backend Endpoints — Mobile

Every HTTP endpoint the React Native app calls today, grouped by feature.
Base URL is `AppConfig.API_BASE_URL` (currently the UAE-North Azure
Container Apps host) — paths below are appended to it.

All successful responses from the v1 BE are wrapped in
`{ statusCode, message, result }`. `HttpClient.request()` strips that
envelope before returning, so each row below documents the **inner
`result` shape** that data sources see — not the wire payload.

The Zoho start/login calls use raw `fetch` (not `HttpClient`) because they
run during sign-in, before any token-aware client is wired up; their
data source unwraps the envelope inline.

Caller path is `src/data/data_sources/<feature>/<file>.ts` unless noted.

---

## 1. Health & Warm-up

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `GET` | `/health` | `auth/zoho_auth.remote_data_source.ts → warmUpBackend()` | Pings the BE health endpoint up to 5× with exponential backoff before kicking off Zoho OAuth, to absorb Azure Container Apps cold-start 404s. No auth, no `/api` prefix — registered via `MapHealthChecks("/health")`. |

---

## 2. Authentication (Zoho OAuth)

Firebase email/password sign-in goes through the Firebase SDK, **not** REST,
so it is not listed here. Only the Zoho-initiated flow hits the backend
directly.

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/zoho/start` | `auth/zoho_auth.remote_data_source.ts → authenticate()` | Asks the BE to mint a signed Zoho authorization URL + state. Body: `{ clientType: 'mobile', redirectUri }`. Returns `{ authorizationUrl, state, expiresAtUtc }`. |
| *(browser)* | `…/api/v1/auth/zoho/mobile-callback` | Zoho → BE (not called by the app) | The `redirectUri` Zoho redirects to after consent. The BE serves an HTML bounce page that `<meta refresh>`es to `devopsolution://auth/zoho/callback`, which the app intercepts via `InAppBrowser.openAuth`. Path is configured by `AppConfig.ZOHO_MOBILE_REDIRECT_URI` and **must be pre-registered in the Zoho developer console**. |
| `POST` | `/api/v1/auth/zoho/login` | `auth/zoho_auth.remote_data_source.ts → authenticate()` | Exchanges the Zoho `code` + `state` from the deep-link callback for a Firebase custom token + profile snapshot. Body: `{ zohoCode, state, redirectUri, clientType: 'mobile' }`. Returns `ZohoLoginResponse` (`accessToken`, `isActive`, `email`, `fullName`, `roleName`, `mustChangePassword`, `provider`, `imageUrl?`). 404 → mapped to `zoho-employee-not-linked`. |

---

## 3. Identity / Profile

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/auth/me` | `me/me.remote_data_source.ts → fetchMe()` | Loads the canonical profile for the signed-in user after Firebase auth resolves — `subjectId`, `provider`, `email`, `displayName`, `role`, `permissions[]`, `mustChangePassword`, and embedded `employee` (id, slackUserId, empCode, displayName, avatarUrl, teamId). Source of truth for `selectCurrentUser` and `selectHasPermission`. Retries up to 3× on network / 5xx; 4xx fails fast. |

---

## 4. Attendance — Personal

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/attendance/me` | `attendance/attendance.remote_data_source.ts → getCurrentStatus()` | Returns today's `EmployeeStatusDto` for the signed-in user — current state (`InOffice` / `WFH` / `SignedOut` / `Absent`), sign-in/out times, etc. Drives the home-screen attendance card. |
| `POST` | `/api/v1/attendance/signin` | `attendance/attendance.remote_data_source.ts → signIn()` | Records sign-in. Body: `{ place: 'InOffice' \| 'WFH', signInUtc? }`. Mobile sends `signInUtc` so the BE doesn't have to trust server clock skew. Returns the updated `EmployeeStatusDto`. |
| `POST` | `/api/v1/attendance/signout` | `attendance/attendance.remote_data_source.ts → signOut()` | Records sign-out. Empty body. Returns the updated `EmployeeStatusDto`. |
| `GET` | `/api/v1/users/me/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD` | `attendance/attendance.remote_data_source.ts → getHistory()` | Returns a `PersonalAttendanceDayDto[]` covering a 30-day window. The app does cursor-style paging by sliding the `[from, to]` window back 30 days per page. Casing normalized client-side: `WFH` → `Wfh`. |

---

## 5. Vacations / Leave — Employee

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/vacations/leave-types?startDate=YYYY-MM-DD` | `leave/leave.remote_data_source.ts → getAvailableLeaveTypes()` | Lists leave types the employee may submit for, given the start date (BE applies eligibility / once-per-career / accrual rules). |
| `GET` | `/api/v1/vacations/balances?year=YYYY` | `leave/leave.remote_data_source.ts → getLeaveBalances()` | Per-type remaining balance for the requested calendar year (defaults to current year). |
| `GET` | `/api/v1/vacations?status&page&pageSize` | `leave/leave.remote_data_source.ts → getMyLeaveRequests()` | Paginated list of the employee's own leave requests. Optional filter by status (`Pending`, `Approved`, `Rejected`, `Cancelled`). |
| `GET` | `/api/v1/vacations/{id}` | `leave/leave.remote_data_source.ts → getLeaveRequestDetail()` | Detail view for a single leave request, including attachments and approval history. |
| `POST` | `/api/v1/vacations` | `leave/leave.remote_data_source.ts → submitLeaveRequest()` | Submits a new leave request. Body: `SubmitLeaveRequestDto` (type, dates, reason, attachmentIds). Returns the new id plus weekend / attendance-conflict warning flags so the UI can confirm before notifying. |
| `DELETE` | `/api/v1/vacations/{id}/cancel` | `leave/leave.remote_data_source.ts → cancelLeaveRequest()` | Employee-driven cancellation of their own pending or approved request. |

---

## 6. Vacations / Leave — Admin / Manager

Currently behind `USE_MOCK_LEAVE` in some screens; the wiring is real but
the admin UI may stub when manager endpoints aren't live yet.

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/vacations?status&page&pageSize` | `leave/leave.remote_data_source.ts → adminGetLeaveRequests()` | Paginated list of leave requests visible to the manager / admin for review. |
| `PUT` | `/api/v1/admin/vacations/{id}/approve` | `leave/leave.remote_data_source.ts → adminApproveLeaveRequest()` | Approves a request. Body: `ReviewLeaveRequestDto` (optional comment). |
| `PUT` | `/api/v1/admin/vacations/{id}/reject` | `leave/leave.remote_data_source.ts → adminRejectLeaveRequest()` | Rejects a request. Body: `ReviewLeaveRequestDto` (rejection reason). |

---

## 7. Short-Permission Requests (Late / Early Leave)

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/leave/permissions/quota` | `leave/leave.remote_data_source.ts → getPermissionQuota()` | Returns the employee's monthly permission quota — `permissionsUsed`, `permissionsAllowed`, `monthResetsAt`. |
| `GET` | `/api/v1/leave/permissions?cursor&pageSize` | `leave/leave.remote_data_source.ts → getPermissionRequests()` | Cursor-paginated list of the employee's own permission requests. |
| `POST` | `/api/v1/leave/permissions` | `leave/leave.remote_data_source.ts → createPermissionRequest()` | Submits a new permission request. Body: `{ permissionType: 'Late' \| 'Early', date, startTime, endTime }`. |

---

## 8. Attachments (shared by Leave + Permissions)

Used to stage files (medical certificates, supporting docs) **before**
submitting a leave or permission request — the parent request then
references the staged `id` via `attachmentIds[]`.

`uploadFile` is the **only** call in the app that bypasses `HttpClient`:
it uses `react-native-blob-util` because RN's JS-side FormData / fetch
combination silently fails on Android RN ≥ 0.85. Multipart bodies are
built natively. (Documented in `frontend/mobile/CLAUDE.md`.)

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/attachments` *(multipart)* | `attachment/attachment.remote_data_source.ts → uploadFile()` | Uploads one file. Returns `AttachmentMetadataDto` with the staged `id`. Sends `Authorization: Bearer …` but lets the runtime set `Content-Type: multipart/form-data; boundary=…`. |
| `GET` | `/api/v1/attachments/{id}/download` | `attachment/attachment.remote_data_source.ts → getDownloadUrl()` | Returns a short-lived signed URL the client uses to fetch the actual file from blob storage. |
| `DELETE` | `/api/v1/attachments/{id}` | `attachment/attachment.remote_data_source.ts → deleteStaged()` | Removes a staged-but-not-yet-attached file. Permission `attachment:delete-staged` required server-side. |

---

## 9. Slack — User OAuth Linking

Optional flow that lets an employee link their personal Slack account
(so attendance posts / mentions can target them directly).

| Method | Path | Caller | Purpose |
|---|---|---|---|
| `GET` | `/api/slack/user-oauth/start` *(no `/v1`)* | `slack/slack_oauth.remote_data_source.ts → getAuthorizationUrl()` | Returns the Slack authorization URL the app opens in `InAppBrowser`. |
| `GET` | `/api/slack/user-oauth/status` *(no `/v1`)* | `slack/slack_oauth.remote_data_source.ts → getConnectionStatus()` | Returns `{ connected: boolean }` so the UI can render either "Connect Slack" or "Connected". |
| `DELETE` | `/api/v1/slack/user-oauth/disconnect` | `slack/slack_oauth.remote_data_source.ts → disconnect()` | Tears down the link. Note the **`/v1` prefix mismatch** with `start` / `status` — those two paths are still on the legacy `/api/slack/…` route. Worth aligning when the BE has bandwidth. |

---

## Cross-cutting notes

- **Envelope.** `HttpClient.request()` and `postMultipart()` strip
  `{ statusCode, message, result }` so callers see only `result`. The
  multipart upload (Section 8) bypasses `HttpClient`, so its handler
  parses the response directly — keep an eye on it if the BE ever wraps
  multipart responses too.
- **Auth header.** `HttpClient` automatically attaches
  `Authorization: Bearer <Firebase ID token>` via the injected
  `TokenProvider`. Anonymous calls (`/health`, the Zoho `/start` and
  `/login`) intentionally bypass `HttpClient` so they don't depend on a
  token being present.
- **401 handling.** A single `onUnauthorized` hook in `HttpClient` clears
  the session and bounces the user to the login screen — so individual
  thunks do not need to handle 401 themselves.
- **Mock flags.** Endpoints in Sections 5–7 honor `USE_MOCK_LEAVE` /
  `USE_MOCK_PERMISSIONS` in `src/di/config.ts`. When flipped, the data
  source short-circuits and returns canned fixtures so the UI can be
  built before the BE ships.
- **Path inconsistencies to clean up.**
  - Slack OAuth `start` / `status` are on `/api/slack/…`, while
    `disconnect` is on `/api/v1/slack/…` — pick one.
  - The mobile Zoho redirect URI (`AppConfig.ZOHO_MOBILE_REDIRECT_URI`)
    must exactly match what's registered in the Zoho developer console
    and what the BE callback route exposes. Today the config points at
    `…/api/auth/zoho/mobile-callback` (no `/v1`), while every other auth
    path uses `/api/v1/…` — confirm with the BE which path is real and
    align both ends.
