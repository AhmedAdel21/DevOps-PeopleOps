// Wire shape for one row in the request activity log. Returned by both
// the mobile self-service endpoints (GET /api/v1/vacations/{id}/log,
// GET /api/v1/leave/permissions/{id}/log) and the management equivalents.
// Mirrors BE `Devopsolution.Dal.Models.Responses.Hr.RequestLogInfoModel`
// added in Phase 4e.1.5. Phase 4f.4 wires it onto mobile.

export interface RequestLogDto {
  id: number;
  requestId: number;
  /** `RequestLogTypeEnum` numeric value (smallint). FE uses this to
   *  pick the icon/colour for the timeline entry. */
  actionId: number;
  /** BE-emitted enum name (`"RequestCreated"`, `"RequestStatusChanged"`,
   *  `"RequestCommentAdded"`, `"RequestClosed"`, etc.). Fallback when
   *  actionId isn't recognised. */
  actionName: string;
  /** Human-readable description — already formatted by the BE
   *  ("Manager approved with comment: 'X'", "Updated — type A→B"). */
  notes: string;
  createdById: number | null;
  /** Display name of the actor, joined from `AppUser.FullName`. */
  createdByName: string | null;
  /** ISO 8601 with offset. */
  createdDate: string;
}
