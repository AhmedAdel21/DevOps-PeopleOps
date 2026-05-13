// Wire shape returned by GET /api/v1/vacations/leave-types — matches
// BE's Devopsolution.Dal.Models.Responses.Hr.LeaveTypeSummaryDto verbatim.
//
// The BE schema is intentionally thinner than the legacy mobile shape:
// the old project had a LeaveTypeConfiguration entity with NameAr,
// ColorHex, RequiresMedicalCertificate, IsOncePerCareer and
// MaxConsecutiveDays — none of which exist in the new EF schema. The
// mapper fills sensible defaults so the UI keeps rendering.
export interface LeaveTypeSummaryDto {
  leaveTypeId: number;          // LeaveTypeEnum: 1=Urgent, 2=Annual, 3=Sick
  nameEn: string;
  isUnlimited: boolean;
  allowSameDay: boolean;
  allowPastDate: boolean;
  remainingDays: number | null; // null for unlimited types
}
