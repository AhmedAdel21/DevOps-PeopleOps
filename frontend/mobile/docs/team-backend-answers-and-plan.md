# Team tab — resolved answers & mobile realignment plan

Backend sent the full schemas. **Every previously-blocking question is now
answered.** Supersedes `backend-questions.md`; concretizes
`team-backend-alignment.md`. The mobile **UI is unchanged**; this is a
data-layer realignment, and it's smaller than feared because the live
**leave feature already models these shapes**.

Key reuse facts (verified in code):
- `LeaveRequestDetailDto` ≈ **`LeaveInfoModel` 1:1** (same base + `employeeEmail/empJobLevel/empImageUrl/currentAnnual|Sick|UrgentLeaveBalance/attachments`).
- `PaginationDataDto` == backend `PagedResult.pagination` exactly.
- `mapHttpErrorToLeave` already handles the live BE error shape (403/422/message) → team reuses it; **`mapHttpErrorToManagement` is dead → delete**.
- `VACATIONS_STATUS_MAP` already maps `Pending→New` etc. → reuse.
- `formatTeamStatusLabel(status,isLate,signedIn,signedOut)` (TDD'd, Slice 1b) → reuse for Attendance row labels.

---

## A. Resolved answers

| Q | Resolution |
|---|---|
| **A1 `AttendanceHistoryDto`** | ✅ **Derivable.** Query `?from={d}&to={d}` (single day) for the per-day roster the design needs. **Summary chips** ← `dailyStats[]` entry for `d`: `inOffice`, `wfh`→Remote, `absent`; **Late** = count of `employees[].days[d]` with `unexcusedLateMinutes>0`; **OnLeave** = `status==Vacation` count. **Rows** ← each `employees[]` → its `days[]` entry for `d`. Range support (from≠to) exists for a future history view (revives the currently-dead `getTeamAttendanceHistory`). |
| **A2 `LeaveInfoModel`** | ✅ Already modeled by mobile's `LeaveRequestDetailDto`. Reuse the leave DTO + `leave.mapper`. |
| **A3 `PermissionInfoModel`** | RequestInfoModel + permission fields; mobile's permission DTOs cover it. Reuse **iff** permissions are in scope (see B1). |
| **A4 `BaseResponseObj<long>`** | `{id,actionId,actionName,message}`; no error `code`; errors = 403/validation + `message`. → Reuse `mapHttpErrorToLeave`; surface `message`; delete `mapHttpErrorToManagement`. |
| **B2 detail endpoint** | ❌ None — **render Approval Detail from the tapped list item** (`LeaveInfoModel` carries contact/job-level/image + balances + attachments + period). No extra fetch. |
| **C2 scope** | ✅ Confirmed role-driven server scoping; no client scope/dept params; handle `403` + message. **Department picker stays removed.** |
| **C3 balance/conflict/precedent** | **Balance Impact** ✅ derivable: before = `current{Annual\|Sick\|Urgent}LeaveBalance` (by `leaveTypeName`), after = before − `period`. **Conflict + precedent** ❌ no source → those ynfPj blocks are a documented **design trim**. |

### Two product calls — proceeding on the recommended default (override if wrong)

- **B1 Approvals scope:** backend exposes leaves **and** permissions; design QosTu shows leave requests. **Default: Approvals = leaves only** (parity with the committed UI). Permissions is a fast-follow via the identical pattern (`/management/requests/permissions` + existing permission DTOs) — not in this realignment.
- **B3 reject reason:** accepted + echoed in `BaseResponseObj.message`, **not persisted**. **Default: keep the reject sheet** (it still drives the decision and the comment is echoed) and soften the sheet copy so it doesn't imply a stored audit note. Backend persisting it later is a no-op for mobile.
- **C1 Arabic leave-type name:** `leaveTypeName` is single-language. **Default: client keeps a local EN↔AR leave-type map** (we already have leaveType tokens); unknown types render EN only.

---

## B. Field mapping (backend → mobile)

**Attendance** (`AttendanceHistoryDto`, `from=to=selectedDate`):

| Mobile (`SerializableTeamDay`) | From backend |
|---|---|
| `summary.inOffice/remote/absent` | `dailyStats[d].inOffice / wfh / absent` |
| `summary.late` | count `employees[].days[d].unexcusedLateMinutes > 0` |
| `summary.onLeave` | count `employees[].days[d].status == 'Vacation'` |
| `summary.notSignedIn` | folded into Absent (backend has no NotSignedIn status) |
| row `displayName / avatar` | `employees[].displayName` / `avatarUrl` (image) + initials fallback |
| row `status` | `days[d].status`: InOffice→Office, Wfh→Remote, SignedOut→SignedOut, Absent/«none»→Absent, Vacation→OnLeave |
| row `isLate` | `days[d].unexcusedLateMinutes > 0` |
| row `signedInAt/Out` | `days[d].signIn / signOut` |
| row `statusLabel` | `formatTeamStatusLabel(...)` — extend to take `hoursWorked` directly for the "· 8h worked" suffix |
| row `departmentName` | only `departmentId` exists (no name, no list endpoint) → **dcnNd dept sub-label is a trim** unless BE adds a name/lookup |

**Approvals list** (`PagedResult<LeaveInfoModel>`, `GET /management/requests/leaves?status=New&page&pageSize`): reuse the existing leave admin DTO/mapper verbatim; grouping (Overdue >3d / Today / This week) + "submitted N ago" + bilingual label computed **client-side** from `createdDate`/`fromDate`/`period` (real logic → unit-tested).

**Approve/Reject:** existing leave-admin call is already `PUT …/{approve|reject}` `{reviewerComment}` → **only the path constant changes** to `/api/v1/management/requests/leaves/{id}/{approve|reject}`. Surface `BaseResponseObj.message` on success.

**Detail:** from the navigated list item — employee (`employeeName`,`empJobLevel`,`empImageUrl`,`employeeEmail`,`employeeMobile1`), request (`leaveTypeName`,`fromDate`,`toDate`,`period`,`attachments`), balance impact (derived), status. No conflict/precedent.

---

## C. Mobile change list (scopeable now — no blockers remain)

**Delete** (bespoke, unsupported by backend):
- `domain|data` `pending_approvals/*`, `approval_detail/*`, `department/*` + their slice state/selectors/use-cases/DI + `mapHttpErrorToManagement`.

**Rewrite:**
- `team_attendance` data source → `GET /api/v1/management/attendance/history?from&to`; new mapper deriving the per-day roster from `AttendanceHistoryDto` (reuse/extend the TDD'd `formatTeamStatusLabel`). Slice fetches `from=to=selectedDate`.

**Reuse (repath only):**
- Approvals list → existing leave admin DTO/mapper/`PaginationDataDto`/status map, path `/management/requests/leaves`.
- Approve/Reject → existing leave-admin thunks, path → `/management/requests/leaves/{id}/...`.
- Errors → `mapHttpErrorToLeave`.

**UI:** unchanged except — remove the dept picker (done-ish: gated off; now delete it), Approval Detail drops conflict/precedent blocks (keeps balance), reject-sheet copy softened (B3).

**TDD:** the Attendance day-derivation (status/summary/label/isLate from `AttendanceHistoryDto`) and the Approvals client-side grouping/"submitted N ago" are real logic → failing test first, like `formatTeamStatusLabel`. DTO reuse / repath / deletions = no tests (config/structural), per the established line.

**Flip mock flags off** per surface as each `/management/…` path is verified live.

No open blockers — ready to implement on request. Recommend slicing:
(1) delete bespoke + repath Approvals/approve-reject to `/management` (reuse, fast),
(2) Attendance rewrite + derivation tests,
(3) detail-from-list-item + copy/UI trims.

---

## F. Execution status — ✅ COMPLETE

All slices implemented, type-checked (tsc 0), tested (jest 66/66), committed
to `leaves-feature`:

| Slice | Commit | What |
|---|---|---|
| 1A | `42de4fc` | Repath + rewire Approvals/detail to live `/management/requests/leaves` |
| 1B | `bb5b8e9` | Delete dead bespoke pending_approvals/approval_detail/department layers + HR dept picker |
| 2 | `a03ca8c` | Rewrite Attendance to `/management/attendance/history?from&to`; derive day roster; client-side filter; reuse `mapHttpErrorToLeave` |
| 3 | `1300068` | Derive Approval Detail balance impact; soften reject-sheet copy (B3); conflict/precedent trim (screen already guards null) |

**Post-realignment follow-ups (delivered):**
- **Permissions Approvals fast-follow + swipe-UX redesign — DONE**
  (S1 `f17fa11` · P1 `efe4ce4` · P2 `c89249a` · P3 `a672a9a`):
  Approvals now has inner Leaves|Permissions tabs (each its own
  `/management/requests/{leaves|permissions}` endpoint + count + lazy
  fetch). Swipe no longer auto-fires — both directions reveal a button
  the user taps (swipe-right Approve, swipe-left Reject → shared
  `AppRejectReasonSheet`). Permission period/type labels TDD'd in
  `team_approvals.mapping`. tsc 0, jest 70/70.

**Remaining (out of realignment scope, deferred):**
- Flip `USE_MOCK_TEAM_ATTENDANCE` / `USE_MOCK_ADMIN_ATTENDANCE` off in
  `src/di/config.ts` once `/management/attendance/history` is verified
  on-device (config.ts is env-local, never committed — same as the leave
  feature's go-live). Note: leave **and permission** management Approvals
  already run live (`USE_MOCK_LEAVE`/`USE_MOCK_PERMISSIONS` = false).
- `ManagementError` class is now unused by the error path but still
  referenced by pre-existing prior-management scaffolding — separate
  cleanup pass.
