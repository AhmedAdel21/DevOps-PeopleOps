> ⚠️ **SUPERSEDED — historical diff.** The gaps below are all resolved &
> implemented. Authoritative: **`docs/team-backend-answers-and-plan.md`**
> (§F status).

# Team tab — Backend design vs Mobile design (side-by-side)

Pure factual diff. **Backend** = the delivered "Mobile Management Endpoints
Integration Guide". **Mobile** = what the client was built against
(mock-first, the proposed `team-api-contract.md`, verified from code).
Decisions/asks live in `team-backend-alignment.md`; this file is just the
diff.

One-line summary: **same intent (manager reviews team attendance + requests),
different shape** — backend = thin manager-scoped reuse of the existing
leave/permission models under `/management/…`; mobile = bespoke aggregated/
enriched `/admin/…` endpoints. Approve/reject is the only piece that already
matches.

---

## 1. Cross-cutting

| Aspect | Backend | Mobile (built) | Δ |
|---|---|---|---|
| Base / auth | `/api/v1`, Bearer | `/api/v1`, Bearer | ✅ same |
| Path namespace | `/management/…` | `/admin/…` | ❌ different prefix everywhere |
| Scope | Server-driven by role (HR/CEO/SysAdmin unscoped · Manager=depts · TeamLead=teams · else `403`) | Client sends `departmentId`; HR picker gated client-side on `attendance:override` | ❌ mobile assumes a client dept filter; backend has none |
| Paging | Server: `page`,`pageSize`,`sortBy`,`sortDirection` | Mixed: attendance/day none; pending had `page/pageSize` but UI filtered by time | ⚠️ realign to server paging |
| Status model | `New\|InReview\|Approved\|Rejected\|Confirmed\|Closed`; Pending = `New\|InReview` | Leave DTOs already map this enum (`Pending→New`); team Approvals filtered by **time** (all/today/week/month) | ⚠️ mobile filter semantics wrong (time≠status) |
| Error/response | `BaseResponseObj<long>`; `403` + message | team layer `mapHttpErrorToManagement` expects `{code,message}`; leave layer uses `mapHttpErrorToLeave` (live, handles `BaseResponseObj`) | ⚠️ team must reuse the leave error pattern |

---

## 2. Team Attendance (read)

| | Backend | Mobile (built) |
|---|---|---|
| Endpoint | `GET /management/attendance/history` | `GET /admin/team-attendance/day` **+** `/history` |
| Params | `from`,`to` (req, yyyy-MM-dd) | day: `date?`,`departmentId?`,`filter?` · history: `startDate`,`endDate`,`departmentId?`,`filter?`,`page?`,`pageSize?` |
| Returns | `AttendanceHistoryDto` (schema not yet provided) | `TeamAttendanceDay { date, summary{inOffice,remote,absent,late,notSignedIn,onLeave}, rows[{userId,displayName,avatarInitials,avatarColorHex,departmentName,status,isLate,signedInAt,signedOutAt,statusLabel}] }` |
| Granularity | Date **range** only | Per **day** (summary + roster) |
| Δ | ❌ No per-day endpoint, no `summary`, no per-row `status`/`isLate`/`statusLabel`, no client `filter`/`departmentId`. **The whole Attendance roster design (chips, status pills, "Since 8:30 AM", Late badge, filters) has no direct backend equivalent — depends on `AttendanceHistoryDto` shape (blocking question Q1).** |

---

## 3. Approvals list (pending requests)

| | Backend | Mobile (built) |
|---|---|---|
| Endpoint(s) | `GET /management/requests/leaves` **and** `GET /management/requests/permissions` (separate) | `GET /admin/approvals/pending` (one combined) |
| Params | `status?`,`page?`,`pageSize?`,`sortBy?`,`sortDirection?` | `range?` = `all\|today\|week\|month`, `page?`,`pageSize?` |
| Returns | `PagedResult<LeaveInfoModel>` / `PagedResult<PermissionInfoModel>` (flat) | `{ pendingCount, sections:[{key:overdue\|today\|thisWeek,title,items:[…]}] }` (server-grouped) |
| Item shape | `LeaveInfoModel` / `PermissionInfoModel` (raw; mobile already models `LeaveRequestListItemDto`) | `{ requestId, employeeName, avatarInitials, avatarColorHex, unread, leaveTypeEn, leaveTypeAr, dateRangeLabel, submittedAgoLabel, submittedAt }` (enriched + bilingual + preformatted) |
| Δ | ❌ Leaves & permissions **split**, not combined. ❌ **Flat, not grouped** — Overdue/Today/This-week + "submitted N ago" + bilingual names are mobile inventions → client must compute. ⚠️ Pending = `status=New\|InReview`, not a time range. |

---

## 4. Approve / Reject  ✅ closest match

| | Backend | Mobile (built) |
|---|---|---|
| Method | `PUT` | `PUT` ✅ |
| Path | `/management/requests/{leaves\|permissions}/{id}/{approve\|reject}` | `/admin/vacations/{id}/{approve\|reject}` (leave-admin reuse) |
| Body | `{ "reviewerComment": "…" }` | `{ reviewerComment?: string }` ✅ |
| Returns | `BaseResponseObj<long>` | `void` (ignored) |
| Reason persistence | accepted + echoed in response, **NOT stored as audit field** | reject sheet implies it's saved |
| Δ | ✅ method+body align. ❌ path differs. ⚠️ reject-reason persistence mismatch (UX). |

---

## 5. Request detail

| | Backend | Mobile (built) |
|---|---|---|
| Endpoint | *None in the guide* | `GET /admin/approvals/{id}` |
| Returns | — | `{ employee{name,roleTitle,departmentName,attendanceRecordUrl}, status, request{typeEn,typeAr,datesLabel,durationLabel,submittedLabel,note}, balanceImpact{before,after}, conflict{title,rows[]}, precedentLabel }` |
| Δ | ❌ No enriched detail endpoint. **Balance-impact / attendance-conflict / precedent blocks have no backend source.** Detail must reuse list item or an existing per-request detail (blocking Q4). |

---

## 6. Departments / HR selector

| | Backend | Mobile (built) |
|---|---|---|
| Endpoint | *None* (scope is server-driven by role) | `GET /admin/departments` → `[{id,nameEn,nameAr,memberCount,managerEmployeeId,managerName}]` + a picker sheet |
| Δ | ❌ No departments endpoint, no client dept filtering. **The HR department picker is dead UI** → removed; backend scoping replaces it. |

---

## 7. What this means structurally

- **Aligned:** approve/reject (method + body), status enum (mobile leave layer already maps it), Bearer/`/api/v1`.
- **Mobile deletes:** bespoke `pending_approvals`, `approval_detail`, `department` data layers; rewrites `team_attendance`; drops the dept picker; reuses the existing leave/permission DTOs+mappers under `/management/…`.
- **Backend-blocked:** Attendance shape (Q1), leaves-vs-permissions scope (Q2), reject-reason persistence (Q3), detail endpoint (Q4) — see `team-backend-alignment.md` §C.
- **Untouched:** all UI (screens, design system, i18n, gestures) — only the data layer diverges.
