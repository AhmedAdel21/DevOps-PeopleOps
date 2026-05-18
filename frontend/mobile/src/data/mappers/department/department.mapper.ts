import type { Department, DepartmentDetail } from '@/domain/entities';
import type {
  DepartmentDetailDto,
  DepartmentDto,
} from '@/data/dtos/department';

// Structural passthrough — departments carry no derived/formatted fields.

export const departmentDtoToDomain = (d: DepartmentDto): Department => ({
  id: d.id,
  nameEn: d.nameEn,
  nameAr: d.nameAr,
  memberCount: d.memberCount,
  managerEmployeeId: d.managerEmployeeId,
  managerName: d.managerName,
});

export const departmentDetailDtoToDomain = (
  d: DepartmentDetailDto,
): DepartmentDetail => ({
  ...departmentDtoToDomain(d),
  memberIds: d.memberIds,
});
