export type YachtStatus = 'available' | 'maintenance' | 'disabled';

// export type YachtType =
//   | 'sailboat'
//   | 'motorboat'
//   | 'catamaran'
//   | 'other';

export type Yacht = {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  createdAt: any;
  active: boolean;
};