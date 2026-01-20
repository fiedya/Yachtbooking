export type YachtStatus = 'available' | 'maintenance' | 'disabled';

export type YachtType =
  | 'sailboat'
  | 'motorboat'
  | 'catamaran'
  | 'other';

export type Yacht = {
  id: string;                  // Firestore doc ID
  name: string;                // "Odesa"
  type: YachtType;
  status: YachtStatus;
  photoUrl: string | null;
};
