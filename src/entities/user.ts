export enum UserStatus {
  ToVerify = 0,
  Verified = 1,
  Rejected = 2,
}

export type UserPreferences = {
  usePseudonims: boolean;
  useYachtShortcuts: boolean;
};

export type User = {
  uid: string; // Firebase Auth UID (doc ID)
  phone: string;
  name: string;
  surname: string;
  pseudonim: string;
  description: string;
  photoUrl: string | null;
  createdAt: any;
  role: "user" | "admin";
  status: UserStatus;
  preferences?: UserPreferences;
};
