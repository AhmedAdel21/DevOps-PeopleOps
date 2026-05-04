/**
 * Per-leave-type policy fields editable from the Leave Configuration
 * screens (9v12n list and TyjaN expanded card). The backing endpoints
 * don't exist in the backend yet — the data source runs in mock mode
 * behind AppConfig.USE_MOCK_LEAVE_CONFIG until they ship.
 *
 * The "status" chip ("Configured" / "Default") on the list row reflects
 * whether HR has saved overrides for the type (`Configured`) or it's
 * still using the BE-shipped defaults (`Default`).
 */

export type LeaveTypeConfigStatus = 'Configured' | 'Default';

export interface LeaveTypePolicy {
  readonly allowSameDay: boolean;
  readonly allowPastDate: boolean;
  /** Only meaningful when allowPastDate is true. */
  readonly maxDaysBack: number | null;
  readonly maxConsecutiveDays: number | null;
  readonly annualAllowance: number | null;
}

export interface LeaveTypeConfig {
  readonly leaveTypeId: number;
  readonly nameEn: string;
  readonly nameAr: string;
  readonly colorHex: string;
  readonly status: LeaveTypeConfigStatus;
  readonly policy: LeaveTypePolicy;
}

// ── Inputs ─────────────────────────────────────────────────────────────────

export interface UpdateLeaveTypePolicyInput {
  readonly leaveTypeId: number;
  readonly policy: LeaveTypePolicy;
}

export interface ResetLeaveTypePolicyInput {
  readonly leaveTypeId: number;
}
