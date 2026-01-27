export type UserStatus = 'to-verify' | 'verified' | 'rejected';


export type UserPreferences = {
  usePseudonims: boolean;
  useYachtShortcuts: boolean;
};

export type User = {
  uid: string;                 // Firebase Auth UID (doc ID)
  phone: string;
  name: string;
  surname: string;
  pseudonim: string;
  description: string;
  photoUrl: string | null;
  createdAt: any;
  role: 'user' | 'admin';
  status: UserStatus;
  preferences?: UserPreferences;
};
