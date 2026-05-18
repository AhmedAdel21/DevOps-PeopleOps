> ⚠️ **SUPERSEDED & HISTORICAL — do NOT implement against this.** This was
> the *proposed* bespoke contract. The backend chose a different design
> (manager-scoped reuse under `/api/v1/management/…`) and the mobile
> realignment is **done**. Authoritative: **`docs/team-backend-answers-and-plan.md`**
> (§F execution status). Kept only for design/decision history.

# Team tab — API contract (for the backend team)

Status: **proposed — client builds against mocks until each endpoint ships**
Scope: the Team tab (designs EfKE5, dcnNd, xZLeT, QosTu, vZ5G0, ynfPj, UirUR, uAdAe).
Owner of client contracts: `src/domain/repositories/team_attendance.repository.ts`,
`leave.repository.ts` (admin methods). This doc is the server-side spec the
mobile client already codes against.

> The mobile app ships with these mocked (`AppConfig.USE_MOCK_TEAM_ATTENDANCE`,
> `USE_MOCK_ADMIN_ATTENDANCE`, `USE_MOCK_DEPARTMENTS` = `true`). Flip each flag
> to `false` per-endpoint as the server delivers it — no client code change.

---

## 1. Conventions

- **Base URL:** `AppConfig.API_BASE_URL` (prod Azure container app).
- **Auth:** `Authorization: Bearer <Firebase ID token>` on every request
  (auto-attached). Identity/permissions are server-owned; the client never
  sends role/department — **scoping is BE-driven from the token**.
- **Versioning:** `/api/v1/...`; admin/manager surface under `/api/v1/admin/...`
  (matches the existing `ADMIN_VACATIONS = /api/v1/admin/vacations`).
- **Permissions (re-checked server-side every call; 403 ⇒ `forbidden`):**
  - Team Attendance read → `attendance:view-others`
  - HR all-departments + dept selector → **client gates on
    `attendance:override`** (a `…:view-all` permission does not exist in the
    app's permission set; `override` is the admin-attendance capability a
    plain team Manager lacks). **Backend: confirm which permission truly
    represents "see/select any department" so client + server agree** — if
    you mint a dedicated `attendance:view-all`, the client switches to it.
  - Approvals list/detail → `leave:approve` (read implies it)
  - Approve / Reject → `leave:approve`
- **Manager vs HR Admin is NOT a client flag.** Same endpoints. The token's
  scope decides: a Manager receives only their department + no `departmentId`
  filter honored; HR receives all departments and may pass `departmentId`.
- **Dates:** request params `yyyy-MM-dd`; timestamps in responses ISO-8601 in
  the **viewer's** timezone (server converts).
- **Pagination:** `page` (1-based), `pageSize` (default `20`,
  `AppConfig.PAGE_SIZE`); responses echo `page`, `pageSize`, `totalCount`.
- **Error envelope** (any non-2xx) — maps to `ManagementError`:
  ```json
  { "code": "manager-out-of-scope", "message": "Human readable." }
  ```
  HTTP → client `mgmtCode`: 401→`unauthenticated`, 403→`forbidden`,
  404→`not-found`, 409→`conflict`, 422/400(structured)→`validation`,
  5xx/timeout→`network`/`unknown`. `code` is surfaced verbatim as `serverCode`.

---

## 2. Reused — already live (no new work)

The **Approvals** segment and **Approval Detail** approve/reject reuse the
existing admin vacations endpoints the leave feature already integrates:

| Purpose | Method & path | Notes |
|---|---|---|
| Admin/manager request list (raw) | `GET /api/v1/admin/vacations` | already implemented; `?status=Pending&page=&pageSize=` |
| Approve | `POST /api/v1/admin/vacations/{id}/approve` | body `{ "note": "<optional>" }` |
| Reject | `POST /api/v1/admin/vacations/{id}/reject` | body `{ "note": "<reason>" }` — **required**, from the reject sheet (uAdAe) |
| Request detail (base) | existing leave-request-detail endpoint | base of Approval Detail |

**No changes requested to these.** New work below only adds the *team
aggregation/enrichment* the designs need on top.

---

## 3. New endpoints

### 3.1 `GET /api/v1/admin/team-attendance/day`

Backs the Attendance segment (EfKE5 / dcnNd / xZLeT). One day, current scope.

**Query**

| param | type | required | notes |
|---|---|---|---|
| `date` | `yyyy-MM-dd` | no | defaults to today (server TZ) |
| `departmentId` | string | no | **HR only**; ignored for Manager scope |
| `filter` | enum | no | `Office`\|`Remote`\|`Absent`\|`Late`\|`NotSignedIn`; omit = All. Server-side filter. |

**200 response** — exactly `TeamAttendanceDay`:

```json
{
  "date": "2026-04-08",
  "summary": { "inOffice": 9, "remote": 2, "absent": 1, "late": 0, "notSignedIn": 0, "onLeave": 0 },
  "rows": [
    {
      "userId": "u_123",
      "slackUserId": "U04AB12CD",
      "displayName": "Ahmed El-Sayed",
      "avatarInitials": "AE",
      "avatarColorHex": "#5559D6",
      "departmentId": "d_eng",
      "departmentName": "Engineering",
      "status": "Office",
      "isLate": false,
      "signedInAt": "2026-04-08T08:30:00+03:00",
      "signedOutAt": null,
      "statusLabel": "Office · Since 8:30 AM"
    },
    {
      "userId": "u_777", "slackUserId": null,
      "displayName": "Hana Ali", "avatarInitials": "HA", "avatarColorHex": null,
      "departmentId": "d_eng", "departmentName": "Engineering",
      "status": "NotSignedIn", "isLate": false,
      "signedInAt": null, "signedOutAt": null,
      "statusLabel": "Not signed in"
    }
  ]
}
```

- `status` ∈ `Office|Remote|Absent|SignedOut|NotSignedIn|OnLeave`. **`Late` is
  not a status** — it overlays via `isLate` on Office/Remote (design shows
  "Office · Since 9:45 AM" + a red "Late" badge).
- `statusLabel` is **optional**: server-formatted and rendered verbatim
  when present (e.g. `"Signed out at 6:00 PM · 8h worked"`, `"Absent today"`
  — keep the exact design copy); **if omitted/null the client derives it**
  from `status` + `signedInAt` + `signedOutAt`. Omitting it during early
  BE development is fine — the client mapper produces the same strings.
- `departmentName` is shown under the name **only in HR scope** (design dcnNd
  rows: "Sara Ahmed / Engineering / Office · Since 9:02 AM"); the client
  decides whether to render it from scope, so always send it.
- HR header subtitle ("All departments · 48 members") and Manager subtitle
  ("Engineering Dept. · 12 members") derive from `summary` totals + scope; no
  extra field needed unless you prefer a `scopeLabel` (optional, see Q1).
- ⚠️ **Member-count integrity:** the client derives "N members" as
  `inOffice + remote + absent + notSignedIn + onLeave` (excludes `late`,
  which overlays). This is only correct if those five buckets are
  **mutually exclusive** (every member in exactly one). **Either guarantee
  that, or add an explicit `totalMembers` to the summary** (recommended —
  BE owns the source of truth). Until resolved the client count can drift
  from reality when buckets overlap.

### 3.2 `GET /api/v1/admin/team-attendance/history`

Backs date-nav into the past (paged). Same scoping rules.

**Query:** `startDate`, `endDate` (required, `yyyy-MM-dd`), `departmentId?`,
`filter?`, `page?`, `pageSize?`.

**200** — `TeamAttendanceHistoryPage`:

```json
{
  "items": [ { "date": "2026-04-07", "summary": { "...": 0 }, "rows": [ ] } ],
  "totalCount": 30, "page": 1, "pageSize": 20
}
```

### 3.3 `GET /api/v1/admin/departments` (reuse / confirm)

HR dept-selector dropdown (dcnNd "All departments ▾"). The client's
`DepartmentRepository.listDepartments()` already targets the departments
list; confirm the path is `GET /api/v1/departments` returning:

```json
[ { "id": "d_eng", "nameEn": "Engineering", "nameAr": "الهندسة",
    "memberCount": 12, "managerEmployeeId": "e_1", "managerName": "…" } ]
```

The selector also needs a synthetic "All departments" option — **client-side**,
not a server row.

### 3.4 `GET /api/v1/admin/approvals/pending` — **the one genuinely new aggregation**

Backs the Approvals segment (QosTu / vZ5G0). This is `GET /admin/vacations`
**grouped + enriched** for the design (sections Overdue / Today / This week,
bilingual leave type, "submitted N ago", unread dot). Server does the grouping
so the client renders verbatim and stays paging-simple.

**Query**

| param | type | notes |
|---|---|---|
| `range` | enum | `all`\|`today`\|`week`\|`month` (filter chips). Default `all`. |
| `page`,`pageSize` | int | pages the **flattened** list; sections recomputed per page is fine |

**200**

```json
{
  "pendingCount": 3,
  "sections": [
    {
      "key": "overdue",
      "title": "Overdue (> 3 days)",
      "items": [
        {
          "requestId": "v_5001",
          "employeeName": "Mariam Abbas",
          "avatarInitials": "MA",
          "avatarColorHex": "#1F9D74",
          "unread": true,
          "leaveTypeEn": "Sick Leave",
          "leaveTypeAr": "إجازة مرضية",
          "dateRangeLabel": "5 Apr – 7 Apr · 3 days",
          "submittedAgoLabel": "Submitted 5 days ago",
          "submittedAt": "2026-04-05T10:12:00+03:00"
        }
      ]
    },
    { "key": "today", "title": "Today's requests", "items": [ ] },
    { "key": "thisWeek", "title": "This week", "items": [ ] }
  ],
  "page": 1, "pageSize": 20, "totalCount": 3
}
```

- `*Label` strings are **server-formatted, rendered verbatim** (bilingual
  leave type is shown as `"Sick Leave"` + `"· إجازة مرضية"`).
- `requestId` is the same id used by the reused approve/reject endpoints (§2).
- Empty state (vZ5G0) = `pendingCount: 0`, `sections: []`.

### 3.5 `GET /api/v1/admin/approvals/{requestId}` — enriched Approval Detail

Backs ynfPj / UirUR. Superset of the existing leave-request detail with three
team-only blocks the design shows: attendance conflict, balance impact,
precedent.

**200**

```json
{
  "requestId": "v_5001",
  "employee": {
    "name": "Ahmed Adel", "avatarInitials": "AA", "avatarColorHex": "#5559D6",
    "roleTitle": "Senior Developer", "departmentName": "Engineering",
    "attendanceRecordUrl": "/api/v1/admin/team-attendance/history?..."
  },
  "status": "Pending",
  "request": {
    "typeEn": "Annual Leave", "typeAr": "إجازة سنوية",
    "datesLabel": "14–18 Apr 2026", "durationLabel": "5 days",
    "submittedLabel": "10 Apr 2026", "note": "Family vacation"
  },
  "balanceImpact": { "leaveTypeLabel": "Annual Leave", "beforeLabel": "18 days", "afterLabel": "13 days" },
  "conflict": {
    "title": "Attendance conflict detected",
    "rows": [
      "Mon 14 Apr — Office · 9:02–18:15",
      "Tue 15 Apr — Office · 8:55–17:30",
      "Wed 16 Apr — No record"
    ]
  },
  "precedentLabel": "Ahmed has taken Annual Leave 2 times previously."
}
```

- `conflict` is **nullable** — omit/`null` when there's no conflict (design
  hides the whole section).
- All `*Label` fields server-formatted, rendered verbatim.
- Approve from here → §2 approve; Reject → opens the reject sheet (uAdAe),
  body `{ "note": "<reason>" }` to §2 reject. The "Confirm approve" state
  (UirUR) is **client-only** (no extra endpoint).

---

## 4. Open questions for backend (answer inline; client will adapt mappers)

1. **`scopeLabel`** — prefer the server send the header subtitle
   (`"Engineering Dept. · 12 members"` / `"All departments · 48 members"`),
   or should the client compose it from `summary` + scope? *(Client default:
   compose client-side; one less server concern.)*
2. **`/admin/approvals/pending` grouping** — OK for the **server** to own the
   Overdue/Today/This-week bucketing (recommended — keeps "submitted N ago"
   and bucket thresholds consistent with BE clock), or return flat + client
   groups? *(Client default: server groups.)*
3. **Reject reason required?** Design's reject sheet has a free-text area;
   confirm `note` is **mandatory** on `POST .../reject` and the max length.
4. **`attendanceRecordUrl`** — return a deep-linkable params object instead of
   a URL string? *(Client default: give us `{ userId, startDate, endDate }`
   and we build the in-app route.)*
5. **History pagination unit** — page by day (recommended) or by row?

---

## 5. Delivery / flag mapping

| Endpoint | Client mock flag | Flip to `false` when… |
|---|---|---|
| `/admin/team-attendance/day` `/history` | `USE_MOCK_TEAM_ATTENDANCE` (Manager), `USE_MOCK_ADMIN_ATTENDANCE` (HR all-dept) | endpoint live — **flip BOTH together** ⚠️ |

> ⚠️ **Flag-pairing:** the client can't know its own scope (Manager vs HR
> is BE-driven from the token), so it mocks team-attendance while *either*
> flag is `true`. Flip `USE_MOCK_TEAM_ATTENDANCE` **and**
> `USE_MOCK_ADMIN_ATTENDANCE` to `false` **as a pair** when the day/history
> endpoint ships — flipping only one leaves the whole feature on mock.
| `/admin/departments` | `USE_MOCK_DEPARTMENTS` | endpoint live |
| `/admin/approvals/pending` `/{id}` | reuses leave admin (`USE_MOCK_LEAVE` already `false`) + new aggregation behind `USE_MOCK_TEAM_ATTENDANCE` until shipped | aggregation live |
| approve / reject | none — already live | — |

Client implementation order (mirrors the leave feature layering):
domain (committed) → data sources + mappers + dtos → repository impl reading
the flags → use cases → DI registration → slice/selectors → screens.
