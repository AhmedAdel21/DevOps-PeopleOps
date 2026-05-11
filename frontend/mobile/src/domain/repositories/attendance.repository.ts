import type { Attendance, AttendancePlace, AttendanceHistoryPage } from '@/domain/entities';

export interface AttendanceRepository {
  getCurrentStatus(): Promise<Attendance>;
  /**
   * Sign the user in at `place`. `signedInAt` is the device-local moment
   * the user confirmed sign-in; passed through to BE as ISO-8601 UTC so
   * the recorded timestamp matches what the user saw on the dial. When
   * omitted, BE uses its own server time.
   */
  signIn(place: AttendancePlace, signedInAt?: Date): Promise<Attendance>;
  signOut(): Promise<Attendance>;
  getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage>;
}
