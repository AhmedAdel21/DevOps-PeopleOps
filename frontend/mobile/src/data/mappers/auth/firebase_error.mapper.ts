import { AuthError, type AuthErrorCode } from '@/domain/errors';
import { authLog } from '@/core/logger';

const CODE_MAP: Record<string, AuthErrorCode> = {
  'auth/invalid-email': 'invalid-credentials',
  'auth/user-not-found': 'invalid-credentials',
  'auth/wrong-password': 'invalid-credentials',
  'auth/invalid-credential': 'invalid-credentials',
  'auth/invalid-login-credentials': 'invalid-credentials',
  'auth/user-disabled': 'user-disabled',
  'auth/too-many-requests': 'too-many-requests',
  'auth/network-request-failed': 'network',
};

export const mapFirebaseAuthError = (e: unknown): AuthError => {
  const firebaseCode = (e as { code?: string } | null)?.code;
  const mapped = firebaseCode ? CODE_MAP[firebaseCode] : undefined;
  const authCode: AuthErrorCode = mapped ?? 'unknown';
  const message =
    (e as { message?: string } | null)?.message ?? 'Authentication failed';
  authLog.warn(
    'mapper',
    `Firebase error mapped: firebase="${firebaseCode ?? '<none>'}" → domain="${authCode}"`,
  );
  return new AuthError(authCode, message);
};
