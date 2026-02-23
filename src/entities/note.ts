export type Note = {
  id: string;
  bookingId: string;
  content: string;
  creatorId: string;
  creatorWasAdmin: boolean;
  read: boolean;
  rejected?: boolean;
  createdAt?: any;
};
