import { UseCase } from '@/domain/use_cases/use_case.base';
import type { AuthRepository, MeRepository } from '@/domain/repositories';
import { AuthError, MeError } from '@/domain/errors';
import { authLog } from '@/core/logger';

export interface ChangePasswordInput {
  newPassword: string;
}

export interface ChangePasswordResult {
  /** True when the Firebase ID token was successfully force-refreshed
   *  in step 3. False when the refresh failed (soft error — the
   *  password IS changed and the BE claim IS cleared, but the local
   *  JWT is stale). Callers should NOT trigger an immediate /me refresh
   *  in that case — the stale token would re-fetch the now-cleared
   *  `mustChangePassword: true` claim and overwrite the local
   *  `markPasswordChanged` flip. Wait for the next foreground/auto-
   *  refresh cycle instead. */
  tokenRefreshed: boolean;
}

/**
 * Drives the forced-password-change flow used by:
 *   1. First-login users provisioned by HR (mustChangePassword=true claim
 *      set in the Firebase custom token minted at onboarding).
 *   2. Anyone whose AppUser.MustChangePassword has been flipped true
 *      mid-session (e.g. HR forces a reset).
 *
 * The flow is three steps that MUST run in order:
 *
 *   1. `auth.updatePassword(newPassword)` — set the Firebase password
 *      client-side. The BE never sees plaintext.
 *   2. `me.completePasswordChange()` — POST password-change-complete so
 *      the BE clears the custom claim and the DB flag.
 *   3. `auth.forceRefreshIdToken()` — pull a fresh JWT so subsequent
 *      `/me` and other BE calls carry the cleared claim set.
 *
 * Failure handling:
 *   - Step 1 fails → user sees the Firebase error (weak-password etc.);
 *     nothing on the BE has changed yet.
 *   - Step 2 fails → the Firebase password is already updated, but the
 *     BE still thinks the user must change. Rethrow; the next /me
 *     refresh will retry via the watcher. Log this as a recovery hint.
 *   - Step 3 fails → password is changed BE-side, claim cleared on the
 *     BE, but the local JWT is stale. The next normal token refresh
 *     (within an hour) will pick it up; surface a soft warning.
 *
 * The forgot-password (`reset`) flow does NOT use this use case — it
 * needs an OTP-token-keyed BE endpoint that is not yet built. Leave a
 * TODO at the callsite there.
 */
export class ChangePasswordUseCase extends UseCase<
  ChangePasswordInput,
  ChangePasswordResult
> {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly meRepo: MeRepository,
  ) {
    super();
  }

  async execute({ newPassword }: ChangePasswordInput): Promise<ChangePasswordResult> {
    authLog.info('use_case', 'ChangePasswordUseCase.execute → step 1: Firebase updatePassword');
    try {
      await this.authRepo.updatePassword(newPassword);
    } catch (e) {
      authLog.error('use_case', 'ChangePasswordUseCase step 1 (Firebase) failed', e);
      throw e;
    }

    authLog.info('use_case', 'ChangePasswordUseCase → step 2: BE password-change-complete');
    try {
      await this.meRepo.completePasswordChange();
    } catch (e) {
      // Firebase password is updated but BE wasn't notified. Wrap as
      // an AuthError so the slice's error-handling path stays uniform.
      authLog.error(
        'use_case',
        'ChangePasswordUseCase step 2 (BE complete) failed — password is changed in Firebase but BE still flagged. /me refresh + watcher will recover.',
        e,
      );
      if (e instanceof MeError) {
        throw new AuthError(
          'change-password-failed',
          `Password updated but server confirmation failed: ${e.message}`,
        );
      }
      throw new AuthError(
        'change-password-failed',
        'Password updated but server confirmation failed.',
      );
    }

    authLog.info('use_case', 'ChangePasswordUseCase → step 3: forceRefreshIdToken');
    try {
      await this.authRepo.forceRefreshIdToken();
      authLog.info('use_case', 'ChangePasswordUseCase.execute completed (tokenRefreshed=true)');
      return { tokenRefreshed: true };
    } catch (e) {
      // Soft failure — token refresh will retry on the next request
      // (Firebase refreshes ID tokens hourly anyway). Don't reject the
      // whole flow: the user has successfully changed their password.
      // Callers must NOT trigger an immediate /me refresh — the stale
      // JWT still carries `mustChangePassword: true` in custom claims
      // and the BE would echo it back, overwriting markPasswordChanged.
      authLog.warn(
        'use_case',
        'ChangePasswordUseCase step 3 (forceRefresh) failed — non-fatal; next token refresh will catch up',
        e,
      );
      return { tokenRefreshed: false };
    }
  }
}
