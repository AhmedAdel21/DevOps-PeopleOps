import type { Attendance, AttendancePlace, AttendanceHistoryPage } from '@/domain/entities';

export interface AttendanceRepository {
  getCurrentStatus(): Promise<Attendance>;
  signIn(place: AttendancePlace): Promise<Attendance>;
  signOut(): Promise<Attendance>;
  getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage>;
}
