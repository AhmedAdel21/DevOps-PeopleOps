import type { Me } from '@/domain/entities';

export interface MeRepository {
  fetchMe(): Promise<Me>;
  /** POST /users/me/password-change-complete — clears the
   *  mustChangePassword custom claim on Firebase + the DB flag on AppUser.
   *  Idempotent; safe to call twice. Caller MUST force-refresh the
   *  Firebase ID token afterwards so the next BE request carries the
   *  updated claim set. */
  completePasswordChange(): Promise<void>;
}
