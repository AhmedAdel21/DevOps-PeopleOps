// Wire shapes for the BE's permission endpoints. Matches
// Devopsolution.Dal.Models.Responses.Hr.PermissionInfoModel +
// PermissionQuotaDto + PermissionRequestModel (BE C# types).

import type { PaginationDataDto } from './leave_request.dto';

/** PermissionTypeEnum on the BE: 1 = LateAttendance, 2 = EarlyLeave. */
export type PermissionTypeIdDto = 1 | 2;

export interface PermissionRequestDto {
  id: number;
  permissionTypeId: PermissionTypeIdDto;
  permissionTypeName: string;     // "LateAttendance" | "EarlyLeave"
  permissionStatusId: number;
  permissionStatusName: string;
  requestStatusId: number;
  requestStatusName: string;
  fromDate: string;               // ISO 8601 DateTime
  toDate: string;
  period: number;                 // HOURS (not minutes — BE PeriodInHours)
  employeeId: number;
  employeeName: string;
  isClosed: boolean;
  assignedToId: number | null;
  assignedUserName: string | null;
  createdDate: string;
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
  // ── Per-leg approval state (BE Phase 3 — wire-surfaced flat columns) ──
  // Same shape + semantics as on LeaveRequestListItemDto. Optional for
  // backwards compatibility with older BE deploys. Per-leg status is the
  // `ApprovalDecisionEnum` int: 1=Pending 2=Approved 3=Rejected 4=Superseded.
  needCeoApprove?: boolean;
  managerApprovalStatus?: number;
  managerApprovedById?: number | null;
  managerActedDate?: string | null;
  hrApprovalStatus?: number;
  hrApprovedById?: number | null;
  hrActedDate?: string | null;
  ceoApprovalStatus?: number;
  ceoApprovedById?: number | null;
  ceoActedDate?: string | null;
  decidedById?: number | null;
  decidedDate?: string | null;
}

/** Matches PagedResult<PermissionInfoModel>. Cursor-based pagination on the
 *  mobile was a legacy convention — the BE only exposes page-based. */
export interface PermissionRequestsResponseDto {
  data: PermissionRequestDto[];
  pagination: PaginationDataDto;
}

/** Body for POST /api/v1/leave/permissions. */
export interface CreatePermissionRequestDto {
  permissionTypeId: PermissionTypeIdDto;
  fromDateTime: string;   // ISO 8601, e.g. "2026-05-12T09:00:00"
  period: number;         // HOURS
}

/** Response wrapper for create — BE returns SubmitPermissionResult. */
export interface SubmitPermissionResultDto {
  success: boolean;
  permissionRequestId: number;
  errorCode: string | null;
  errorMessage: string | null;
  remainingHours: number | null;
}

/** GET /api/v1/leave/permissions/quota. */
export interface PermissionQuotaDto {
  year: number;
  month: number;
  maxHoursPerMonth: number;
  usedHours: number;
  remainingHours: number;
}

/** Permission attachments aren't currently exposed on the new BE — the
 *  RequestAttachment table is only populated through the HR flow, not
 *  the mobile self-service path. Mapper returns []. */
export interface AttachmentSnapshotDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}
