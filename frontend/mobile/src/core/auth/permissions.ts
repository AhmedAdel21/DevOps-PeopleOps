/**
 * String constants for every permission the backend may issue.
 *
 * These exist solely to prevent typos in `selectHasPermission(...)` /
 * `<AppPermissionGate permission={...}>` call sites. The values here are
 * the literal strings returned in `MeResponse.permissions`.
 *
 * THIS FILE MUST NOT CONTAIN ANY ROLE → PERMISSIONS MAPPING.
 *
 * The backend resolves role → permissions and ships the resolved list in
 * `GET /api/auth/me`. The client is role-blind: it only ever asks "do I
 * have permission X?" — never "is my role Y?". When the backend adds a
 * new permission, append the string here and reference it in code; when
 * the backend changes which role can do what, this file does not change.
 */
export const Permissions = {
  Leave: {
    Submit:     'leave:submit',
    Cancel:     'leave:cancel',
    ViewOwn:    'leave:view-own',
    ViewOthers: 'leave:view-others',
    Approve:    'leave:approve',
    Reject:     'leave:reject',
  },
  Attendance: {
    PostOwn:       'attendance:post-own',
    ViewOwn:       'attendance:view-own',
    ViewOthers:    'attendance:view-others',
    Override:      'attendance:override',
    Export:        'attendance:export',
    MarkCheckedIn: 'attendance:mark-checked-in',
    Backfill:      'attendance:backfill',
  },
  Employee: {
    ViewOwn:    'employee:view-own',
    ViewOthers: 'employee:view-others',
    Manage:     'employee:manage',
    AssignRole: 'employee:assign-role',
  },
  Department: {
    View:   'department:view',
    Manage: 'department:manage',
  },
  PermissionRequest: {
    Submit:  'permission-request:submit',
    Cancel:  'permission-request:cancel',
    ViewOwn: 'permission-request:view-own',
  },
  Attachment: {
    Upload:       'attachment:upload',
    Download:     'attachment:download',
    DeleteStaged: 'attachment:delete-staged',
  },
} as const;

/** Union of every permission string the backend may issue. */
export type Permission =
  | (typeof Permissions.Leave)[keyof typeof Permissions.Leave]
  | (typeof Permissions.Attendance)[keyof typeof Permissions.Attendance]
  | (typeof Permissions.Employee)[keyof typeof Permissions.Employee]
  | (typeof Permissions.Department)[keyof typeof Permissions.Department]
  | (typeof Permissions.PermissionRequest)[keyof typeof Permissions.PermissionRequest]
  | (typeof Permissions.Attachment)[keyof typeof Permissions.Attachment];
