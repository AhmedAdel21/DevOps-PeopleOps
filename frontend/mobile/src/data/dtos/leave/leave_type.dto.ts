// Matches LeaveTypeSummaryDto on BE.
export interface LeaveTypeSummaryDto {
  leaveTypeId: number;
  nameEn: string;
  nameAr: string;
  colorHex: string;
  requiresMedicalCertificate: boolean;
  isOncePerCareer: boolean;
  maxConsecutiveDays: number | null;
  allowSameDay: boolean;
}
