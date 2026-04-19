export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type { User } from './user.entity';
export type {
  Attendance,
  AttendancePlace,
  AttendanceStatus,
} from './attendance.entity';
export type {
  AttendanceRecord,
  AttendanceHistoryPage,
  AttendanceRecordStatus,
  AttendanceRecordPlace,
} from './attendance_record.entity';
