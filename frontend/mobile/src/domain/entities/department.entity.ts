/**
 * Entities for the Department Management feature — Departments List
 * (VNql1 + cw1YR empty), Form sheet (q8yBks), Delete confirm (xfDUa),
 * Manager picker (SMxwU) and Move-to-Department picker (JZruf).
 *
 * The screens are HR+ only (gated on department:manage). The picker
 * sheets are also reused by the Add-New-Employee form (EyMv2).
 */

export interface Department {
  readonly id: string;
  readonly nameEn: string;
  /** Arabic name like "الهندسة". The list rows render
   *  "Engineering · الهندسة" so this is required by design; null is allowed
   *  for departments created before the field shipped on the BE. */
  readonly nameAr: string | null;
  readonly memberCount: number;
  readonly managerEmployeeId: string | null;
  /** Display name; null means "No manager" copy from the design. */
  readonly managerName: string | null;
}

/** Returned by GET /api/departments/{id} when we need the member list too
 *  (e.g. to show 24 names on the manager-picker sheet). */
export interface DepartmentDetail extends Department {
  readonly memberIds: readonly string[];
}

// ── Inputs ─────────────────────────────────────────────────────────────────

export interface CreateDepartmentInput {
  readonly nameEn: string;
  readonly nameAr?: string | null;
  readonly managerEmployeeId?: string | null;
}

export interface UpdateDepartmentInput {
  readonly id: string;
  readonly nameEn?: string;
  readonly nameAr?: string | null;
  readonly managerEmployeeId?: string | null;
}

export interface SetDepartmentManagerInput {
  readonly departmentId: string;
  readonly employeeId: string;
}

export interface MoveEmployeeToDepartmentInput {
  readonly employeeId: string;
  /** Null moves the employee to "No department" (design row "Unassigned"). */
  readonly departmentId: string | null;
}
