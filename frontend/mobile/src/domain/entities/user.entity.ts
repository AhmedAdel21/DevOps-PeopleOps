export interface User {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoUrl: string | null;
  readonly emailVerified: boolean;
}
