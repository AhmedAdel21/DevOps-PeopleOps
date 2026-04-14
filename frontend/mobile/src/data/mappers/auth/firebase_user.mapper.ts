import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { User } from '@/domain/entities';

export const firebaseUserToDomain = (
  user: FirebaseAuthTypes.User,
): User => ({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoUrl: user.photoURL,
  emailVerified: user.emailVerified,
});
