import auth, {
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { authLog } from '@/core/logger';

export class FirebaseAuthRemoteDataSource {
  async signIn(email: string, password: string): Promise<void> {
    authLog.info(
      'data_source',
      `Firebase signInWithEmailAndPassword → email=${authLog.maskEmail(email)}`,
    );
    try {
      let userCredential: FirebaseAuthTypes.UserCredential = await auth().signInWithEmailAndPassword(email, password);
      authLog.info('data_source', 'Firebase signInWithEmailAndPassword resolved', userCredential);
      authLog.info('data_source', 'Firebase signInWithEmailAndPassword resolved');
    } catch (e) {
      const code = (e as { code?: string } | null)?.code ?? 'unknown';
      authLog.error(
        'data_source',
        `Firebase signInWithEmailAndPassword rejected (code=${code})`,
        e,
      );
      throw e;
    }
  }

  async signOut(): Promise<void> {
    authLog.info('data_source', 'Firebase signOut →');
    try {
      await auth().signOut();
      authLog.info('data_source', 'Firebase signOut resolved');
    } catch (e) {
      const code = (e as { code?: string } | null)?.code ?? 'unknown';
      authLog.error(
        'data_source',
        `Firebase signOut rejected (code=${code})`,
        e,
      );
      throw e;
    }
  }

  getCurrentUser(): FirebaseAuthTypes.User | null {
    const u = auth().currentUser;
    authLog.info(
      'data_source',
      `getCurrentUser → uid=${u?.uid ?? '<none>'}`,
    );
    return u;
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = auth().currentUser;
    if (!user) {
      authLog.info('data_source', 'getIdToken → no current user');
      return null;
    }
    try {
      const token = await user.getIdToken(forceRefresh);
      authLog.info(
        'data_source',
        `getIdToken → ok (len=${token.length}, forceRefresh=${forceRefresh})`,
      );
      return token;
    } catch (e) {
      authLog.error('data_source', 'getIdToken failed', e);
      throw e;
    }
  }

  /**
   * Update the currently-signed-in user's password client-side. The BE
   * never sees the plaintext. Firebase may reject with
   * `auth/requires-recent-login` if the user's session is stale —
   * mappers surface that as a re-auth prompt.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const user = auth().currentUser;
    if (!user) {
      authLog.warn('data_source', 'updatePassword → no current user');
      throw new Error('no-current-user');
    }
    authLog.info('data_source', 'Firebase updatePassword →');
    try {
      await user.updatePassword(newPassword);
      authLog.info('data_source', 'Firebase updatePassword resolved');
    } catch (e) {
      const code = (e as { code?: string } | null)?.code ?? 'unknown';
      authLog.error(
        'data_source',
        `Firebase updatePassword rejected (code=${code})`,
        e,
      );
      throw e;
    }
  }

  /**
   * Force-refresh the Firebase ID token so the latest custom claims
   * (e.g. cleared mustChangePassword) land in the JWT used by subsequent
   * BE calls. Returns the new token, or null if no user is signed in.
   */
  async forceRefreshIdToken(): Promise<string | null> {
    return this.getIdToken(true);
  }

  async signInWithCustomToken(token: string): Promise<void> {
    authLog.info('data_source', 'Firebase signInWithCustomToken →');
    try {
      await auth().signInWithCustomToken(token);
      authLog.info('data_source', 'Firebase signInWithCustomToken resolved');
    } catch (e) {
      const code = (e as { code?: string } | null)?.code ?? 'unknown';
      authLog.error(
        'data_source',
        `Firebase signInWithCustomToken rejected (code=${code})`,
        e,
      );
      throw e;
    }
  }

  observe(
    cb: (user: FirebaseAuthTypes.User | null) => void,
  ): () => void {
    authLog.info('data_source', 'onAuthStateChanged subscribed');
    const unsubscribe = auth().onAuthStateChanged((user) => {
      authLog.info(
        'data_source',
        `onAuthStateChanged fired → uid=${user?.uid ?? '<none>'}, email=${authLog.maskEmail(user?.email)}`,
      );
      cb(user);
    });
    return () => {
      authLog.info('data_source', 'onAuthStateChanged unsubscribed');
      unsubscribe();
    };
  }
}
