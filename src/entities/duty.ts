export type DutyOfficer = {
  id: string;
  name: string;
  phone: string;
};

export type Duty = {
  id: string;
  start: any; // Firestore Timestamp
  end: any;
  dutyOfficerId: string;
  dutyOfficerName: string;
  dutyOfficerPhone: string;
  createdAt: any;
};
