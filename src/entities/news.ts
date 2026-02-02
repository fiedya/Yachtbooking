export enum NewsCategory {
  General = 1,
  Yachts = 2,
  Stanica = 3,
  Events = 4,
}

export enum NewsStatus {
  Active = 1,
  Old = 2,
}

export interface News {
  id?: string;
  title: string;
  description: string;
  category: NewsCategory;
  dateOfDeactivate: any;
  status: NewsStatus;
  createdAt: any;
}
