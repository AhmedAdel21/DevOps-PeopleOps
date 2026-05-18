import type {
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  MoveEmployeeToDepartmentInput,
  SetDepartmentManagerInput,
  UpdateDepartmentInput,
} from '@/domain/entities';
import type { DepartmentRepository } from '@/domain/repositories';
import { DepartmentRemoteDataSource } from '@/data/data_sources/department';
import {
  departmentDetailDtoToDomain,
  departmentDtoToDomain,
} from '@/data/mappers/department';
import { mapHttpErrorToManagement } from '@/data/mappers/team_attendance';
import { ManagementError } from '@/domain/errors';
import { managementLog } from '@/core/logger';

/**
 * Only the READ paths are wired here — that's all the Team tab's HR
 * department selector needs. The mutation methods belong to the future
 * Department Management feature (its own slice/screens); until that ships
 * they fail loudly rather than silently no-op.
 */
const notImplemented = (op: string): never => {
  throw new ManagementError(
    'unknown',
    `Department.${op} is part of the Department Management feature, not yet implemented.`,
  );
};

export class DepartmentRepositoryImpl implements DepartmentRepository {
  constructor(private readonly ds: DepartmentRemoteDataSource) {}

  async listDepartments(): Promise<readonly Department[]> {
    managementLog.info('repository', 'listDepartments called');
    try {
      const dtos = await this.ds.listDepartments();
      const result = dtos.map(departmentDtoToDomain);
      managementLog.info(
        'repository',
        `listDepartments → ${result.length} departments`,
      );
      return result;
    } catch (e) {
      const mapped = mapHttpErrorToManagement(e);
      managementLog.error(
        'repository',
        `listDepartments failed (code=${mapped.mgmtCode})`,
      );
      throw mapped;
    }
  }

  async getDepartment(id: string): Promise<DepartmentDetail> {
    managementLog.info('repository', `getDepartment called (id=${id})`);
    try {
      const dto = await this.ds.getDepartment(id);
      return departmentDetailDtoToDomain(dto);
    } catch (e) {
      const mapped = mapHttpErrorToManagement(e);
      managementLog.error(
        'repository',
        `getDepartment failed (code=${mapped.mgmtCode})`,
      );
      throw mapped;
    }
  }

  // ── Department Management mutations — not in scope yet ───────────────
  createDepartment(_input: CreateDepartmentInput): Promise<Department> {
    return notImplemented('createDepartment');
  }
  updateDepartment(_input: UpdateDepartmentInput): Promise<Department> {
    return notImplemented('updateDepartment');
  }
  deleteDepartment(_id: string): Promise<void> {
    return notImplemented('deleteDepartment');
  }
  setDepartmentManager(
    _input: SetDepartmentManagerInput,
  ): Promise<Department> {
    return notImplemented('setDepartmentManager');
  }
  moveEmployeeToDepartment(
    _input: MoveEmployeeToDepartmentInput,
  ): Promise<void> {
    return notImplemented('moveEmployeeToDepartment');
  }
}
