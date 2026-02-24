export enum BookingStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Cancelled = 3,
}

export type Booking = {
  id: string;
  userId: string;
  userName: string;
  yachtIds: string[];
  yachtNames: string[];
  yachtId?: string;
  yachtName?: string;
  start: any;
  end: any;
  status: BookingStatus;
  createdAt: any;
};
