import type {
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  MoveEmployeeToDepartmentInput,
  SetDepartmentManagerInput,
  UpdateDepartmentInput,
} from '@/domain/entities';

/**
 * Repository for the Department Management feature — list + CRUD
 * (VNql1, q8yBks, xfDUa), manager picker (SMxwU), and the
 * move-to-department flow (JZruf).
 *
 * Read endpoints are also reused by the Add-New-Employee form (EyMv2)
 * for the department select.
 *
 * Permissions:
 *   - list / detail   → department:view
 *   - create / update / delete / set-manager / move-employee → department:manage
 */

export interface DepartmentRepository {
  listDepartments(): Promise<readonly Department[]>;
  getDepartment(id: string): Promise<DepartmentDetail>;

  createDepartment(input: CreateDepartmentInput): Promise<Department>;
  updateDepartment(input: UpdateDepartmentInput): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;

  setDepartmentManager(
    input: SetDepartmentManagerInput,
  ): Promise<Department>;

  moveEmployeeToDepartment(
    input: MoveEmployeeToDepartmentInput,
  ): Promise<void>;
}
