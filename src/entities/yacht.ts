export enum YachtStatus {
  Disabled = 0,
  Available = 1,
  Maintenance = 2,
  NotOurs = 3,
}

export type Yacht = {
  id: string;
  name: string;
  type: string;
  description: string;
  shortcut: string;
  imageUrl: string;
  createdAt: any;
  active: boolean;
  status: YachtStatus;
};
