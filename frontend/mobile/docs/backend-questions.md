> ⚠️ **SUPERSEDED — all answered.** Resolved in
> **`docs/team-backend-answers-and-plan.md`**; the realignment is done
> (§F status). Kept for history.

# Backend questions — answer these to apply the server changes into mobile

Paste-ready for the backend team. The mobile **UI is done** (screens,
design system, i18n, gestures); only the **data layer** changes. Nothing
below is a redesign request — it's the information needed to repoint mobile
at the delivered `/api/v1/management/…` API. Companion: `team-design-vs-
backend.md` (the diff), `team-backend-alignment.md` (the plan).

Already aligned — **no answer needed**: approve/reject method + body
(`PUT …/{approve|reject}` `{ reviewerComment }`) and the request-status
enum. Don't change these.

---

## A. Schemas to send us (can't write the mappers without them)

| # | Need | Why it blocks |
|---|---|---|
| A1 | **`AttendanceHistoryDto` JSON** (a real example response) + answer: is it **per-employee-per-day rows** (sign-in/out timestamps the client derives status/summary/labels from) or **pre-aggregated**? Does each row carry **department** (for the HR all-departments view)? | Gates the **entire Team Attendance screen**. The design needs per-day summary chips, a status (`Office/Remote/Absent/SignedOut/NotSignedIn/OnLeave`), an `isLate` flag, and labels like "Office · Since 8:30 AM". We map/derive these client-side **only if** the DTO carries the raw material. Can't write the mapper blind. **Highest priority.** |
| A2 | **`LeaveInfoModel` JSON** — confirm it matches mobile's existing `LeaveRequestListItemDto` (leave is already live, so likely yes — just confirm or send the diff). | Approvals (leaves) reuses the existing leave DTO/mapper. Need parity confirmation. |
| A3 | **`PermissionInfoModel` JSON** (only if permissions are in scope — see B1). | Needed to map the permissions list if it's part of Approvals. |
| A4 | **`BaseResponseObj<long>` shape** (success + error/`403` body). | Error/response mapping must reuse the right pattern (the live leave layer already handles this shape — confirm so team reuses it, not the bespoke `{code,message}` mapper). |

## B. Product/architecture decisions we need from you

| # | Question | What mobile does per answer |
|---|---|---|
| B1 | **Approvals = leaves only, permissions only, or both?** Backend splits `/management/requests/leaves` and `/…/permissions`. The design (QosTu) shows leave requests. | leaves-only → one list, reuse leave DTO. both → two sub-tabs or merged list (more work). permissions-only → swap the model. Decides the Approvals screen architecture. |
| B2 | **Is there a per-request *detail* endpoint in manager scope?** e.g. `GET /management/requests/leaves/{id}` or reuse the existing `/api/v1/vacations/{id}`. The guide lists only list + approve/reject. | If yes → Approval Detail fetches it. If no → detail renders only from the list item the user tapped (drops fields not in the list). |
| B3 | **Will `reviewerComment` be persisted as an audit field, or is it transient** (you currently accept + echo it, but don't store it)? | persisted → keep the reject-reason sheet as designed. transient → relabel/soften the UI so it doesn't imply a saved audit note. Pure product call. |

## C. Confirmations (not blocking — we'll map around, but answer to avoid rework)

| # | Question | Default if unanswered |
|---|---|---|
| C1 | Does `LeaveInfoModel` carry an **Arabic leave-type name**, or only one language? | Client keeps a local EN↔AR leave-type map; AR shown best-effort. |
| C2 | Confirm the **scope model**: client does NOT send department/scope params and just handles `403` + your message; you scope by role server-side. | Proceed on that assumption; remove the client department picker. |
| C3 | Will you expose **balance-impact / attendance-conflict / precedent** for a request (design ynfPj shows them), or are those out of scope? | Those detail blocks are **hidden** in the UI (known design trim, not a bug). |

---

## Bottom line

**To start the rework we need: A1 (critical), A4, and B1 + B2.**
A2/A3 are confirmations; B3 and all of C can be answered in parallel
without holding up code. Give us A1's schema/example first — it's the
single biggest unknown and the only one that could change whether the
Attendance screen is buildable as designed.
