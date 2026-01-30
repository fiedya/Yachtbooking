export type Booking = {
  id: string;
  userId: string;
  userName: string;
  yachtId: string;
  yachtName: string;
  start: any;
  end: any;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
};
