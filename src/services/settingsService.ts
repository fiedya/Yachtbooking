import {
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "@/src/firebase/init";
import { Settings } from "../entities/settings";

const SETTINGS_COLLECTION = "settings";

/* ----------------------------------
   Create or update (upsert)
----------------------------------- */

export async function createOrUpdateSettings(
  userId: string,
  usePseudonims = false,
  useYachtShortcuts = false,
) {
  try {
    const snap: any = await getDoc(SETTINGS_COLLECTION, userId);

    if (!snap.exists()) {
      await setDoc(SETTINGS_COLLECTION, userId, {
        userId,
        usePseudonims,
        useYachtShortcuts,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(SETTINGS_COLLECTION, userId, {
        usePseudonims,
        useYachtShortcuts,
      });
    }
  } catch (e: any) {
    console.warn(
      "[settingsService] createOrUpdateSettings error:",
      e?.message || e,
    );
  }
}

/* ----------------------------------
   Read once
----------------------------------- */

export async function getSettings(
  userId: string,
): Promise<Settings | null> {
  try {
    const snap: any = await getDoc(SETTINGS_COLLECTION, userId);
    return snap.exists() ? (snap.data() as Settings) : null;
  } catch (e: any) {
    console.warn(
      "[settingsService] getSettings error:",
      e?.message || e,
    );
    return null;
  }
}

/* ----------------------------------
   Realtime subscription
----------------------------------- */

export function subscribeToSettings(
  userId: string,
  onChange: (settings: Settings | null) => void,
) {
  return onSnapshot(
    SETTINGS_COLLECTION,
    async (snapshot: any) => {
      if (!snapshot) {
        onChange(null);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];
      const doc = docs.find((d: any) => d.id === userId);

      if (!doc) {
        onChange(null);
        return;
      }

      onChange(doc.data() as Settings);
    },
    () => onChange(null),
  );
}

/* ----------------------------------
   Partial update (merge)
----------------------------------- */

export async function updateSettings(
  userId: string,
  data: Partial<Omit<Settings, "userId">>,
) {
  return setDoc(SETTINGS_COLLECTION, userId, data, { merge: true });
}
