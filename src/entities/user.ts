export type UserStatus = 'to-verify' | 'verified' | 'rejected';

export type User = {
  uid: string;                 // Firebase Auth UID (doc ID)
  phone: string;
  name: string;
  surname: string;
  description: string;
  photoUrl: string | null;
  createdAt: any;
  role: 'user' | 'admin';
  status: UserStatus;
};
