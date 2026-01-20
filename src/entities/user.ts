export type User = {
  uid: string;                 // Firebase Auth UID (doc ID)
  phone: string;
  name: string;
  surname: string;
  description: string;
  photoUrl: string | null;     // Profile image (Storage URL)
  createdAt: any;
};
