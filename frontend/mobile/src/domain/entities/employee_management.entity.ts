/**
 * Entities for the Employee Management feature — Employee List (JiUuS),
 * Employee Profile (A4Btg + EWBXx role-change variant), Add New Employee
 * sheet (EyMv2), Deactivation sheet (AJC2v), and the Role Picker (XzX9b)
 * + Promote Confirm (LBKFz).
 *
 * The screens render the role label and the role-picker, but the app does
 * NOT branch behavior on role — every gate is a permission check. RoleId
 * here is *display-only*: the picker labels and the current-role chip on
 * EWBXx come from this enum.
 */

// ── Roles (display-only — never used in if/switch driving UI rendering) ───

export type RoleId =
  | 'Employee'
  | 'Manager'
  | 'HRManager'
  | 'SystemAdmin'
  | 'CEO';

export interface RoleOption {
  readonly id: RoleId;
  readonly nameEn: string;
  readonly nameAr: string;
  readonly descriptionEn: string;
}

// ── Directory ──────────────────────────────────────────────────────────────

/** Filter chip values from the design's chip row. */
export type EmployeeStatusFilter = 'All' | 'Active' | 'Inactive' | 'NoDepartment';

export interface DirectoryEmployee {
  readonly employeeId: string;
  readonly firebaseUid: string | null;
  readonly fullName: string;
  readonly email: string;
  readonly avatarInitials: string;
  readonly avatarColorHex: string | null;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  /** Display-only label like "Engineering · Manager" — built by the mapper
   *  so the row component renders verbatim. */
  readonly departmentRoleLabel: string;
  readonly roleId: RoleId | null;
  readonly isActive: boolean;
}

export interface EmployeeDirectoryPage {
  readonly items: readonly DirectoryEmployee[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface EmployeeDirectoryQuery {
  readonly search?: string;
  readonly status?: EmployeeStatusFilter;
  readonly page?: number;
  readonly pageSize?: number;
}

// ── Profile ────────────────────────────────────────────────────────────────

export interface EmployeeProfile {
  readonly employeeId: string;
  readonly firebaseUid: string | null;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly avatarInitials: string;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly roleId: RoleId | null;
  readonly hireDate: string | null;     // yyyy-MM-dd
  readonly employeeCode: string | null; // "EMP-0042"
  readonly isActive: boolean;
}

// ── Inputs ─────────────────────────────────────────────────────────────────

export interface AddEmployeeInput {
  readonly fullName: string;
  readonly workEmail: string;
  readonly departmentId: string;
  readonly roleId: RoleId;
  readonly hireDate: string; // yyyy-MM-dd
}

export interface AddEmployeeResult {
  readonly employeeId: string;
  /** True when the BE also queued an invitation email with temp credentials,
   *  matching the EyMv2 footnote copy. */
  readonly invitationSent: boolean;
}

export interface UpdateEmployeeInput {
  readonly employeeId: string;
  readonly fullName?: string;
  readonly phone?: string | null;
  readonly hireDate?: string | null;
  readonly employeeCode?: string | null;
}

export interface SetUserDisabledInput {
  readonly firebaseUid: string;
  readonly disabled: boolean;
}

export interface SetUserRoleInput {
  readonly firebaseUid: string;
  readonly roleId: RoleId;
}

export interface ProvisionEmployeeInput {
  readonly employeeId: string;
}
