import type { Attendance, AttendancePlace, AttendanceHistoryPage } from '@/domain/entities';
import type { Coordinates } from '@/core/location';

export interface AttendanceRepository {
  /**
   * Null when the caller has no attendance row for today (i.e. hasn't
   * signed in yet). Throws on other failures, including the BE's
   * `employee_not_linked` 404.
   */
  getCurrentStatus(): Promise<Attendance | null>;
  /**
   * Sign the user in at `place`. `coordinates` are captured from the device
   * GPS at the moment of confirmation — required by the BE so it can audit
   * where the action happened. `signedInAt` is the device-local moment the
   * user confirmed sign-in; passed through to BE as ISO-8601 UTC so the
   * recorded timestamp matches what the user saw on the dial. When omitted,
   * BE uses its own server time.
   */
  signIn(
    place: AttendancePlace,
    coordinates: Coordinates,
    signedInAt?: Date,
  ): Promise<Attendance>;
  signOut(coordinates: Coordinates): Promise<Attendance>;
  getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage>;
}
