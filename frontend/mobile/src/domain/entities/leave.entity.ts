// ── Leave type (dynamic — driven by BE, not a closed union) ────────────────

/** Minimal identifying data for a leave type. */
export interface LeaveTypeRef {
  readonly id: number;          // 1..8 (see BE integration guide)
  readonly nameEn: string;
  readonly nameAr: string;
  readonly colorHex: string;    // '#RRGGBB'
}

/** Full metadata returned by GET /api/vacations/leave-types. */
export interface LeaveTypeMeta extends LeaveTypeRef {
  readonly requiresMedicalCertificate: boolean;
  readonly isOncePerCareer: boolean;
  readonly maxConsecutiveDays: number | null;
  readonly allowSameDay: boolean;
}

// ── Status enums ───────────────────────────────────────────────────────────

export type LeaveRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

// Permission feature (mock-only for now, kept intact).
export type PermissionType = 'Late' | 'Early' | 'MiddleDay' | 'HalfDay';
export type PermissionRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

// ── Balance ────────────────────────────────────────────────────────────────

export interface LeaveBalance {
  readonly typeId: number;
  readonly typeName: string;
  readonly colorHex: string;
  readonly isUnlimited: boolean;
  readonly totalEntitlement: number;
  readonly usedDays: number;
  readonly remainingDays: number;
}

export interface LeaveBalancesSummary {
  readonly year: number;
  readonly balances: LeaveBalance[];
}

// ── Employee list + detail ─────────────────────────────────────────────────

export interface LeaveRequestListItem {
  readonly id: string;
  readonly leaveTypeName: string;
  readonly leaveTypeNameAr: string;
  readonly colorHex: string;
  readonly startDate: string;   // yyyy-MM-dd
  readonly endDate: string;     // yyyy-MM-dd
  readonly totalDays: number;
  readonly status: LeaveRequestStatus;
  readonly hasAttendanceConflict: boolean;
  readonly createdAt: string;   // ISO 8601
}

export interface LeaveRequestsPage {
  readonly items: LeaveRequestListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface LeaveRequestDetail {
  readonly id: string;
  readonly leaveTypeName: string;
  readonly leaveTypeNameAr: string;
  readonly colorHex: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly totalDays: number;
  readonly status: LeaveRequestStatus;
  readonly notes: string | null;
  readonly hasAttendanceConflict: boolean;
  readonly conflictDetails: string | null;
  readonly reviewerComment: string | null;
  readonly reviewedAt: string | null;
  readonly createdAt: string;
  readonly balanceAfterApproval: number | null;
}

// ── Submit ─────────────────────────────────────────────────────────────────

export interface SubmitLeaveResult {
  readonly leaveRequestId: string;
  readonly hasWeekendWarning: boolean;
  readonly hasAttendanceConflictWarning: boolean;
  readonly conflictDetails: string | null;
}

// ── Admin ──────────────────────────────────────────────────────────────────

export interface AdminLeaveRequestListItem extends LeaveRequestListItem {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly employeeCode: string;
  readonly notes: string | null;
  readonly conflictDetails: string | null;
  readonly reviewerComment: string | null;
  readonly reviewedAt: string | null;
}

export interface AdminLeaveRequestsPage {
  readonly items: AdminLeaveRequestListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

// ── Permission feature (mock-only, untouched) ──────────────────────────────

export interface PermissionQuota {
  readonly permissionsUsed: number;
  readonly permissionsAllowed: number;
  readonly monthResetsAt: string; // yyyy-MM-dd
}

export interface PermissionRequest {
  readonly id: string;
  readonly permissionType: PermissionType;
  readonly date: string;          // yyyy-MM-dd
  readonly startTime: string;     // HH:mm
  readonly endTime: string;       // HH:mm
  readonly durationMinutes: number;
  readonly status: PermissionRequestStatus;
}

export interface PermissionRequestsPage {
  readonly items: PermissionRequest[];
  readonly nextCursor: string | null;
}
