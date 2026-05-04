export const DiKeys = {
  // auth
  FIREBASE_AUTH_DATA_SOURCE: 'firebaseAuthDataSource',
  ZOHO_AUTH_DATA_SOURCE: 'zohoAuthDataSource',
  AUTH_REPOSITORY: 'authRepository',
  LOGIN_USE_CASE: 'loginUseCase',
  LOGOUT_USE_CASE: 'logoutUseCase',
  OBSERVE_AUTH_STATE_USE_CASE: 'observeAuthStateUseCase',
  ZOHO_LOGIN_USE_CASE: 'zohoLoginUseCase',

  // slack oauth
  SLACK_OAUTH_DATA_SOURCE: 'slackOAuthDataSource',
  SLACK_REPOSITORY: 'slackRepository',
  GET_SLACK_AUTH_URL_USE_CASE: 'getSlackAuthUrlUseCase',
  CHECK_SLACK_CONNECTION_USE_CASE: 'checkSlackConnectionUseCase',
  DISCONNECT_SLACK_USE_CASE: 'disconnectSlackUseCase',

  // leave
  LEAVE_REMOTE_DATA_SOURCE: 'leaveRemoteDataSource',
  LEAVE_REPOSITORY: 'leaveRepository',
  GET_AVAILABLE_LEAVE_TYPES_USE_CASE: 'getAvailableLeaveTypesUseCase',
  GET_LEAVE_BALANCES_USE_CASE: 'getLeaveBalancesUseCase',
  GET_LEAVE_REQUESTS_USE_CASE: 'getLeaveRequestsUseCase',
  GET_LEAVE_REQUEST_DETAIL_USE_CASE: 'getLeaveRequestDetailUseCase',
  SUBMIT_LEAVE_REQUEST_USE_CASE: 'submitLeaveRequestUseCase',
  CANCEL_LEAVE_REQUEST_USE_CASE: 'cancelLeaveRequestUseCase',
  ADMIN_GET_LEAVE_REQUESTS_USE_CASE: 'adminGetLeaveRequestsUseCase',
  APPROVE_LEAVE_REQUEST_USE_CASE: 'approveLeaveRequestUseCase',
  REJECT_LEAVE_REQUEST_USE_CASE: 'rejectLeaveRequestUseCase',
  GET_PERMISSION_QUOTA_USE_CASE: 'getPermissionQuotaUseCase',
  GET_PERMISSION_REQUESTS_USE_CASE: 'getPermissionRequestsUseCase',
  REQUEST_PERMISSION_USE_CASE: 'requestPermissionUseCase',

  // attachments (shared between leaves & permissions)
  ATTACHMENT_REMOTE_DATA_SOURCE: 'attachmentRemoteDataSource',
  ATTACHMENT_REPOSITORY: 'attachmentRepository',

  // me (BE-shaped profile + permissions)
  ME_REMOTE_DATA_SOURCE: 'meRemoteDataSource',
  ME_REPOSITORY: 'meRepository',
  FETCH_ME_USE_CASE: 'fetchMeUseCase',

  // http + attendance
  HTTP_CLIENT: 'httpClient',
  ATTENDANCE_REMOTE_DATA_SOURCE: 'attendanceRemoteDataSource',
  ATTENDANCE_REPOSITORY: 'attendanceRepository',
  GET_ATTENDANCE_STATUS_USE_CASE: 'getAttendanceStatusUseCase',
  SIGN_IN_ATTENDANCE_USE_CASE: 'signInAttendanceUseCase',
  SIGN_OUT_ATTENDANCE_USE_CASE: 'signOutAttendanceUseCase',
  GET_ATTENDANCE_HISTORY_USE_CASE: 'getAttendanceHistoryUseCase',

  // ── Management: team attendance (read) ───────────────────────────────
  TEAM_ATTENDANCE_REMOTE_DATA_SOURCE: 'teamAttendanceRemoteDataSource',
  TEAM_ATTENDANCE_REPOSITORY: 'teamAttendanceRepository',
  GET_TEAM_ATTENDANCE_DAY_USE_CASE: 'getTeamAttendanceDayUseCase',
  GET_TEAM_ATTENDANCE_HISTORY_USE_CASE: 'getTeamAttendanceHistoryUseCase',

  // ── Management: admin attendance (write — overrides + bulk) ──────────
  ADMIN_ATTENDANCE_REMOTE_DATA_SOURCE: 'adminAttendanceRemoteDataSource',
  ADMIN_ATTENDANCE_REPOSITORY: 'adminAttendanceRepository',
  MARK_CHECKED_IN_USE_CASE: 'markCheckedInUseCase',
  MARK_ON_VACATION_USE_CASE: 'markOnVacationUseCase',
  FORCE_SIGN_OUT_USE_CASE: 'forceSignOutUseCase',
  ADD_PERMISSION_ENTRY_USE_CASE: 'addPermissionEntryUseCase',
  MARK_WORKSPACE_VACATION_DATE_USE_CASE: 'markWorkspaceVacationDateUseCase',
  REMOVE_ATTENDANCE_OVERRIDE_USE_CASE: 'removeAttendanceOverrideUseCase',
  EXPORT_ATTENDANCE_CSV_USE_CASE: 'exportAttendanceCsvUseCase',
  RUN_SLACK_BACKFILL_USE_CASE: 'runSlackBackfillUseCase',

  // ── Management: employees ────────────────────────────────────────────
  EMPLOYEE_MANAGEMENT_REMOTE_DATA_SOURCE: 'employeeManagementRemoteDataSource',
  EMPLOYEE_MANAGEMENT_REPOSITORY: 'employeeManagementRepository',
  LIST_EMPLOYEES_USE_CASE: 'listEmployeesUseCase',
  GET_EMPLOYEE_PROFILE_USE_CASE: 'getEmployeeProfileUseCase',
  ADD_EMPLOYEE_USE_CASE: 'addEmployeeUseCase',
  UPDATE_EMPLOYEE_USE_CASE: 'updateEmployeeUseCase',
  DELETE_EMPLOYEE_USE_CASE: 'deleteEmployeeUseCase',
  PROVISION_EMPLOYEE_USE_CASE: 'provisionEmployeeUseCase',
  SET_USER_DISABLED_USE_CASE: 'setUserDisabledUseCase',
  DELETE_USER_USE_CASE: 'deleteUserUseCase',
  SET_USER_ROLE_USE_CASE: 'setUserRoleUseCase',

  // ── Management: departments ──────────────────────────────────────────
  DEPARTMENT_REMOTE_DATA_SOURCE: 'departmentRemoteDataSource',
  DEPARTMENT_REPOSITORY: 'departmentRepository',
  LIST_DEPARTMENTS_USE_CASE: 'listDepartmentsUseCase',
  GET_DEPARTMENT_DETAIL_USE_CASE: 'getDepartmentDetailUseCase',
  CREATE_DEPARTMENT_USE_CASE: 'createDepartmentUseCase',
  UPDATE_DEPARTMENT_USE_CASE: 'updateDepartmentUseCase',
  DELETE_DEPARTMENT_USE_CASE: 'deleteDepartmentUseCase',
  SET_DEPARTMENT_MANAGER_USE_CASE: 'setDepartmentManagerUseCase',
  MOVE_EMPLOYEE_TO_DEPARTMENT_USE_CASE: 'moveEmployeeToDepartmentUseCase',

  // ── Management: leave-type configuration (mock-backed) ───────────────
  LEAVE_TYPE_CONFIG_REMOTE_DATA_SOURCE: 'leaveTypeConfigRemoteDataSource',
  LEAVE_TYPE_CONFIG_REPOSITORY: 'leaveTypeConfigRepository',
  LIST_LEAVE_TYPE_CONFIGS_USE_CASE: 'listLeaveTypeConfigsUseCase',
  UPDATE_LEAVE_TYPE_POLICY_USE_CASE: 'updateLeaveTypePolicyUseCase',
  RESET_LEAVE_TYPE_POLICY_USE_CASE: 'resetLeaveTypePolicyUseCase',
} as const;

export type DiKey = (typeof DiKeys)[keyof typeof DiKeys];
