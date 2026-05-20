// Wire shapes for `GET /api/v1/management/attendance/team-day?date=…`
// (the slim mobile-only endpoint on Mobile.Api.Employee). The fat
// `/history?from&to` endpoint still exists on the admin host for the
// web dashboard's date-range analytics view — the mobile no longer
// consumes it.
//
// Status vocabulary (lowercase, mirrors the web dashboard):
//   • `office`         — checked in, present at office
//   • `home`           — checked in, working from home
//   • `signedOut`      — was checked in, has since signed out
//                        (Place tells you which side they were on before)
//   • `vacation`       — vacation override OR an approved leave covers
//                        the date
//   • `notCheckedIn`   — no attendance row, no override, no approved leave
// `place` ∈ `office | home | null`, lowercase too.

/** Status counts for the four primary mobile badges + the SignedOut/Late
 *  flags. `office`/`home`/`vacation`/`notCheckedIn` partition the visible
 *  roster; `signedOut`/`late` overlay on top of those. */
export interface TeamDaySummaryDto {
  office: number;
  home: number;
  vacation: number;
  notCheckedIn: number;
  signedOut: number;
  late: number;
  total: number;
}

/** A single employee's record for the requested date. */
export interface TeamDayEmployeeDto {
  /** Canonical HR identifier (`AppUser.EmpCode` on the BE). Used as the
   *  stable row key on the client. Empty string when the BE row is
   *  missing an emp code. */
  empCode: string;
  displayName: string;
  avatarUrl: string | null;
  departmentId: string | null;
  /** One of `office | home | signedOut | notCheckedIn | vacation`. */
  status: string;
  /** `office | home | null` — survives a SignedOut collapse so the chip
   *  can still render Office/Home for a signed-out employee. */
  place: string | null;
  signIn: string | null;   // ISO 8601 datetime
  signOut: string | null;  // ISO 8601 datetime
  /** Sign-in → sign-out duration in decimal hours (e.g. 8.5 = 8h 30m). */
  hoursWorked: number | null;
  /** True when the employee's arrival is past the late threshold beyond
   *  any approved late-arrival permission. */
  isLate: boolean;
}

/** Response envelope for `GET /api/v1/management/attendance/team-day`. */
export interface TeamDayDto {
  date: string; // yyyy-MM-dd
  summary: TeamDaySummaryDto;
  employees: TeamDayEmployeeDto[];
}
