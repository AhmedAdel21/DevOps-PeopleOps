import { Permissions } from '../src/core/auth/permissions';

test('every permission constant matches the BE catalogue spelling', () => {
  // Snapshot — if the BE renames a permission, this test breaks loudly so
  // we update the constants instead of silently shipping stale strings.
  expect(Permissions).toEqual({
    Leave: {
      Submit: 'leave:submit',
      Cancel: 'leave:cancel',
      ViewOwn: 'leave:view-own',
      ViewOthers: 'leave:view-others',
      Approve: 'leave:approve',
      Reject: 'leave:reject',
    },
    Attendance: {
      PostOwn: 'attendance:post-own',
      ViewOwn: 'attendance:view-own',
      ViewOthers: 'attendance:view-others',
      Override: 'attendance:override',
      Export: 'attendance:export',
      MarkCheckedIn: 'attendance:mark-checked-in',
      Backfill: 'attendance:backfill',
    },
    Employee: {
      ViewOwn: 'employee:view-own',
      ViewOthers: 'employee:view-others',
      Manage: 'employee:manage',
      AssignRole: 'employee:assign-role',
    },
    Department: {
      View: 'department:view',
      Manage: 'department:manage',
    },
    PermissionRequest: {
      Submit: 'permission-request:submit',
      Cancel: 'permission-request:cancel',
      ViewOwn: 'permission-request:view-own',
    },
    Attachment: {
      Upload: 'attachment:upload',
      Download: 'attachment:download',
      DeleteStaged: 'attachment:delete-staged',
    },
  });
});

test('Permissions.X.Y values are unique', () => {
  const flat: string[] = [];
  for (const ns of Object.values(Permissions)) {
    for (const v of Object.values(ns)) flat.push(v);
  }
  expect(new Set(flat).size).toBe(flat.length);
});
