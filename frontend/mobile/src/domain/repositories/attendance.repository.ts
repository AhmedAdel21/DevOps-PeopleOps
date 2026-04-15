import type { Attendance, AttendancePlace } from '@/domain/entities';

export interface AttendanceRepository {
  getCurrentStatus(): Promise<Attendance>;
  signIn(place: AttendancePlace): Promise<Attendance>;
  signOut(): Promise<Attendance>;
}
