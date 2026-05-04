import type {
  LeaveTypeConfig,
  ResetLeaveTypePolicyInput,
  UpdateLeaveTypePolicyInput,
} from '@/domain/entities';

/**
 * Repository for the Leave Configuration feature (designs 9v12n + TyjaN).
 *
 * Per Q9:B the backend endpoints don't exist yet — the implementation
 * runs in mock mode behind AppConfig.USE_MOCK_LEAVE_CONFIG. The interface
 * below is shaped around the eventual REST endpoints
 * (`GET /api/management/leave-types`, `PUT /api/management/leave-types/{id}`,
 * `POST /api/management/leave-types/{id}/reset`) so flipping the mock
 * flag later is a one-file swap inside the data source.
 */

export interface LeaveTypeConfigRepository {
  listLeaveTypeConfigs(): Promise<readonly LeaveTypeConfig[]>;
  updateLeaveTypePolicy(
    input: UpdateLeaveTypePolicyInput,
  ): Promise<LeaveTypeConfig>;
  resetLeaveTypePolicy(
    input: ResetLeaveTypePolicyInput,
  ): Promise<LeaveTypeConfig>;
}
