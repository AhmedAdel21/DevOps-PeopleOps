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
      await auth().signInWithEmailAndPassword(email, password);
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
