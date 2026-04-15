import type {
  Attendance,
  AttendancePlace,
  AttendanceStatus,
} from '@/domain/entities';
import type { EmployeeStatusDto } from '@/data/dtos/attendance';

const toDomainStatus = (raw: string | null | undefined): AttendanceStatus => {
  switch (raw) {
    case 'InOffice':
      return 'in_office';
    case 'WFH':
      return 'wfh';
    default:
      return 'not_signed_in';
  }
};

export const placeToDto = (place: AttendancePlace): 'InOffice' | 'WFH' => {
  return place === 'in_office' ? 'InOffice' : 'WFH';
};

export const employeeStatusDtoToDomain = (
  dto: EmployeeStatusDto,
): Attendance => ({
  employeeId: dto.slackUserId,
  displayName: dto.displayName,
  avatarUrl: dto.avatarUrl && dto.avatarUrl.length > 0 ? dto.avatarUrl : null,
  status: toDomainStatus(dto.status),
  signInAt: dto.signInUtc ? new Date(dto.signInUtc) : null,
  signOutAt: dto.signOutUtc ? new Date(dto.signOutUtc) : null,
  departmentId:
    dto.departmentId && dto.departmentId.length > 0 ? dto.departmentId : null,
  departmentName:
    dto.departmentName && dto.departmentName.length > 0
      ? dto.departmentName
      : null,
  isAdminOverride: dto.isAdminOverride,
  overrideMarkedBy: dto.overrideMarkedBy,
  overrideNote: dto.overrideNote,
  lastUpdatedAt: new Date(dto.lastUpdated),
});
