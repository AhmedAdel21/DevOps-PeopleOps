import type {
  AddEmployeeInput,
  AddEmployeeResult,
  DirectoryEmployee,
  EmployeeDirectoryPage,
  EmployeeDirectoryQuery,
  EmployeeProfile,
  ProvisionEmployeeInput,
  SetUserDisabledInput,
  SetUserRoleInput,
  UpdateEmployeeInput,
} from '@/domain/entities';

/**
 * Repository for the Employee Management feature — directory (JiUuS),
 * profile (A4Btg + EWBXx), Add New Employee sheet (EyMv2), Deactivation
 * sheet (AJC2v), Role picker + promote confirm (XzX9b → LBKFz).
 *
 * Permission-gated per the spec:
 *   - read                   → employee:view-others
 *   - add / update / delete  → employee:manage
 *   - role change            → employee:assign-role
 *
 * Disable/enable maps to the existing `users/{firebaseUid}/disabled`
 * endpoint (Q16:default).
 */

export interface EmployeeManagementRepository {
  // ── Directory + profile ─────────────────────────────────────────────

  listEmployees(query: EmployeeDirectoryQuery): Promise<EmployeeDirectoryPage>;
  getEmployeeProfile(employeeId: string): Promise<EmployeeProfile>;

  // ── Mutations on the employee record ────────────────────────────────

  addEmployee(input: AddEmployeeInput): Promise<AddEmployeeResult>;
  updateEmployee(input: UpdateEmployeeInput): Promise<EmployeeProfile>;
  deleteEmployee(employeeId: string): Promise<void>;
  provisionEmployee(input: ProvisionEmployeeInput): Promise<void>;

  // ── Mutations on the Firebase user attached to the record ───────────

  setUserDisabled(input: SetUserDisabledInput): Promise<DirectoryEmployee>;
  deleteUser(firebaseUid: string): Promise<void>;
  setUserRole(input: SetUserRoleInput): Promise<DirectoryEmployee>;
}
