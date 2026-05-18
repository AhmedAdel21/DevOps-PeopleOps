# Team tab ↔ Backend alignment

Reconciles the **mobile client** (built mock-first against the *proposed*
`docs/team-api-contract.md`) with the **delivered backend**
("Mobile Management Endpoints Integration Guide").

> The mobile contract was a *proposal*. The backend chose a different —
> and reasonable — design: **manager-scoped views over the existing
> leave/permission models, under `/api/v1/management/…`**, rather than
> bespoke aggregated/enriched endpoints. This doc is the realignment, not
> a dispute. Mock-first did its job: we have a working app to trial and a
> precise, evidence-based diff instead of a contract argument.

**Verdict:** approve/reject is already aligned (method + body). Everything
else needs mobile rework toward *reuse of the existing leave/permission
data layers*. **3 backend answers block finishing**; the rest are
mappable-around.

---

## A. Aligned already ✅

| Thing | Mobile today | Backend | Status |
|---|---|---|---|
| Approve/Reject method+body | leave admin uses `PUT …/approve\|reject` with `{ reviewerComment }` | `PUT /management/requests/{leaves\|permissions}/{id}/{approve\|reject}` body `{ reviewerComment }` | **Body + method match.** Only the **path** differs. |
| Status model | leave DTOs already map BE `New\|InReview\|Approved\|Rejected\|Confirmed\|Closed` (`Pending→New`) | same enum | Reuse the existing mapping. |
| Server paging | leave admin already consumes `PagedResult` + `PaginationDataDto` | `PagedResult<…>` `page/pageSize/sortBy/sortDirection` | Reuse. |

---

## B. Mobile changes we will make (decided — mobile owns)

These don't need backend input; they follow from the delivered design.

1. **Repath everything to `/api/v1/management/…`.** Today the team data
   sources call non-existent `/api/v1/admin/…` paths:
   - `…/admin/team-attendance/day` & `/history` → **`GET /management/attendance/history?from&to`** (no per-day endpoint; see Q1).
   - `…/admin/approvals/pending` → **`GET /management/requests/leaves`** (+ `/permissions`, see Q2), `status=New|InReview`, server-paged.
   - `…/admin/approvals/{id}` → **no enriched endpoint** — reuse the existing per-request detail (see Q4).
   - `…/admin/vacations/{id}/approve|reject` → **`PUT /management/requests/leaves/{id}/approve|reject`** (+ permissions variants).
2. **Delete the bespoke layers, reuse the leave/permission ones:**
   - `pending_approvals` (Slice 3a — domain + data + slice) **removed**; the Approvals list consumes `PagedResult<LeaveInfoModel>` via the **existing leave admin DTOs/mappers** + a small client-side grouping/label helper (the Overdue/Today/This-week buckets and "submitted N ago" are NOT server-provided — client computes them; this is real logic → unit-tested).
   - `approval_detail` (Slice 4a — domain + data + slice) **removed**; the detail screen reuses the existing leave-request-detail path (pending Q4). Design's *balance impact / attendance conflict / precedent* blocks have **no backend source** → hidden unless backend adds fields (Q5).
   - `department` (Slice 3c — domain + data + slice) **removed**; backend has **no departments endpoint** and scope is server-driven. The HR department picker becomes dead UI → **removed**; `selectedDepartmentId` state left inert for a future server-scoped selector (Q6).
   - `team_attendance` (Slice 1b) **survives in spirit** but is rewritten for the range-history endpoint; depth depends on Q1.
3. **Error handling:** the team layer uses `mapHttpErrorToManagement`
   (assumes `{ code, message }`). Leave is **already live against the real
   backend** and uses `mapHttpErrorToLeave` against `BaseResponseObj`.
   → Team reuses the leave error-mapping pattern; `mapHttpErrorToManagement`
   is likely **dead code** (verify + delete).
4. **Filter chips are status/UI, not server params.** The design's
   Approvals chips (All/Today/This week/This month) are **time-based** and
   the backend filters by **request status** with paging. → "Pending" tab =
   `status=New`/`InReview`; any time grouping is client-side.
5. **Mock flags:** flip `USE_MOCK_TEAM_ATTENDANCE` / `ADMIN_ATTENDANCE` /
   `DEPARTMENTS` to `false` per endpoint as each `/management/…` path is
   verified live (leave/permission reuse already runs with `USE_MOCK_LEAVE=false`).

Net: this is a **deletion-heavy** refactor (≈3 bespoke domain/data/slice
trees removed, ≈Slice-1b rewritten), not an additive one — smaller surface,
more reuse.

---

## C. Open questions that BLOCK finishing (need backend answers)

**Q1 — `AttendanceHistoryDto` schema (blocks the whole Attendance segment).**
The design (Manager/HR roster: summary chips `9 In office / 2 Remote / 1
Absent / 0 Late`, per-row status `Office|Remote|Absent|SignedOut|
NotSignedIn|OnLeave`, `isLate` badge, `"Office · Since 8:30 AM"` /
`"Signed out at 6:00 PM · 8h worked"` labels) assumes per-day, per-employee
**derived** data. The endpoint returns a **date range** (`from`,`to`) of
`AttendanceHistoryDto`.
→ **Please send the `AttendanceHistoryDto` JSON schema.** Specifically: is
it per-employee-per-day records with sign-in/out timestamps the client can
derive status/summary from, or pre-aggregated? Does it carry department for
the HR variant? Without this we cannot write the mapper or know if the
designed screen is buildable from this endpoint.

**Q2 — Approvals scope: leaves, permissions, or both?**
Backend splits `/management/requests/leaves` and `/…/permissions` (separate
models). The design "Pending approvals" (QosTu) shows leave-type requests
(Sick/Annual/Casual + Arabic names). Does the Approvals segment cover
**leaves only / permissions only / both interleaved**? This decides screen
architecture (one list vs two sub-tabs vs merged). Mobile currently models
one combined list.

**Q3 — Reject reason persistence.**
The reject sheet (uAdAe) asks for a reason. Backend **accepts**
`reviewerComment` and echoes it in the response, but **does not persist it
as an audit field**. Options: (a) backend persists it (low cost — already
accepted), (b) UX honest that the reason is transient (relabel / drop the
required-reason gate), (c) ship as-is with the disconnect. Needs a product
call — has UX impact.

**Q4 — Is there a per-request detail endpoint for the management scope?**
The guide lists only list + approve/reject. The Approval Detail screen
(ynfPj) needs a single request's full data. Is `GET /management/requests/
leaves/{id}` (or the existing `/api/v1/vacations/{id}`-style detail) usable
within manager scope, or should the detail screen render purely from the
list item it navigated from?

---

## D. Non-blocking backend asks (mobile maps around these for now)

- **Bilingual leave-type names.** Design renders `Sick Leave · إجازة
  مرضية`. If `LeaveInfoModel.leaveTypeName` is single-language, the AR name
  is dropped (or client keeps a local EN↔AR map). Confirm if an `…Ar`
  field exists/can be added.
- **Detail enrichment** (Q5): balance-impact (`18 days → 13 days`),
  attendance-conflict rows, precedent (`"…taken Annual Leave 2 times"`).
  No backend source → these design blocks are **hidden** until/unless the
  backend exposes them. Flagging so it's a known design trim, not a bug.
- **Departments endpoint** (Q6): none exists; HR dept selector removed.
  If cross-department selection is wanted later, backend needs a
  scoped departments list + an attendance filter param.
- **Scope→permission mapping.** Mobile gated the (now-removed) dept picker
  on `attendance:override`. Backend scopes by role (HR/CEO/SysAdmin
  unscoped; Manager=depts; TeamLead=teams; else 403). The client just
  handles `403` with the backend message; no client permission gating
  needed for scope. Confirm that's the intended model.

---

## E. What I still need from backend to finish the rework

1. `AttendanceHistoryDto` JSON schema (Q1) — **highest priority**.
2. `PermissionInfoModel` JSON schema (and confirm `LeaveInfoModel`
   matches the mobile's existing `LeaveRequestListItemDto`).
3. `BaseResponseObj<long>` shape (so the team layer reuses the right
   error/response mapping — likely the leave feature's).
4. Answers to Q2 (approvals scope), Q3 (reject persistence), Q4 (detail
   endpoint).

Once Q1–Q4 + the schemas land, the realignment is mostly **deletion +
repointing to leave/permission reuse** — estimable and low-risk. The UI
(screens/segments/sheets, design-system, i18n, gestures) is done and
unaffected; only the data layer changes.
