// Wire shape for the enriched approval detail (docs/team-api-contract.md
// §3.5). `conflict` is nullable; all *Label fields are server-formatted
// and rendered verbatim. Structural passthrough in the mapper.

export interface ApprovalEmployeeDto {
  name: string;
  avatarInitials: string;
  avatarColorHex: string | null;
  roleTitle: string;
  departmentName: string;
  attendanceRecordUrl: string | null;
}

export interface ApprovalRequestInfoDto {
  typeEn: string;
  typeAr: string;
  datesLabel: string;
  durationLabel: string;
  submittedLabel: string;
  note: string | null;
}

export interface ApprovalBalanceImpactDto {
  leaveTypeLabel: string;
  beforeLabel: string;
  afterLabel: string;
}

export interface ApprovalConflictDto {
  title: string;
  rows: string[];
}

export interface ApprovalDetailDto {
  requestId: string;
  employee: ApprovalEmployeeDto;
  status: string;
  request: ApprovalRequestInfoDto;
  balanceImpact: ApprovalBalanceImpactDto | null;
  conflict: ApprovalConflictDto | null;
  precedentLabel: string | null;
}
