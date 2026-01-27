import firestore from '@react-native-firebase/firestore';
import { Settings } from '../entities/settings';

export async function createOrUpdateSettings(
  userId: string,
  usePseudonims = false,
  useYachtShortcuts = false
) {

  const ref = firestore().collection('settings').doc(userId);
  const snap = await ref.get();

  console.log('[settingsService] createOrUpdateSettings for userId:', userId);

  if (!snap.exists()) {
    console.log('[settingsService] Creating default settings for userId:', userId);
    await ref.set({
      userId,
      usePseudonims,
      useYachtShortcuts,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await ref.update({
      usePseudonims,
      useYachtShortcuts,
    });
  }
}



export async function getSettings(userId: string): Promise<Settings | null> {
  try {
    const ref = firestore().collection('settings').doc(userId);
    const snap = await ref.get();
    return snap.exists() ? (snap.data() as Settings) : null;
  } catch (e) {
    // If collection does not exist or permission denied, return null
    console.warn('[settingsService] getSettings error:', (e as any)?.message || e);
    return null;
  }
}

export function subscribeToSettings(userId: string, onChange: (settings: Settings | null) => void) {
  try {
    return firestore()
      .collection('settings')
      .doc(userId)
      .onSnapshot(
        snap => {
          if (!snap || !snap.exists) {
            onChange(null);
            return;
          }
          onChange(snap.data() as Settings);
        },
        error => {
          // If collection does not exist or permission denied, return null
          console.warn('[settingsService] subscribeToSettings error:', error?.message || error);
          onChange(null);
        }
      );
  } catch (e) {
    console.warn('[settingsService] subscribeToSettings error:', (e as any)?.message || e);
    onChange(null);
    return () => {};
  }
}

export async function updateSettings(userId: string, data: Partial<Omit<Settings, 'userId'>>) {
  const ref = firestore().collection('settings').doc(userId);
  await ref.set(data, { merge: true });
}
