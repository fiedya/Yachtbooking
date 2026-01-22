import firestore from '@react-native-firebase/firestore';

export async function getUser(uid: string) {
  console.log('[USER SERVICE] getUser uid:', uid);

  const ref = firestore().collection('users').doc(uid);
  const snap = await ref.get();
  return snap.exists() ? snap.data() : null;
}
export async function createOrUpdateUser(
  uid: string,
  phone: string,
  name: string,
  surname: string
) {
  const ref = firestore().collection('users').doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      uid,
      phone,
      name,
      surname,
      description: '',
      photoUrl: null,
      role: 'user',
      status: 'to_verify', // ✅ NEW DEFAULT
      onboarded: true,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await ref.update({
      name,
      surname,
      onboarded: true,
    });
  }

}

export async function createUserIfMissing(
  uid: string,
  phone: string,
  name?: string,
  surname?: string
) {
  const ref = firestore().collection('users').doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      uid,
      phone,
      name: name ?? '',
      surname: surname ?? '',
      description: '',
      photoUrl: null,
      role: 'user',
      status: 'to_verify',
      onboarded: !!(name && surname),
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } else if (name && surname) {
    await ref.update({
      name,
      surname,
      onboarded: true,
      // ❗ do NOT update status
    });
  }
}

export function subscribeToUser(
  uid: string,
  onChange: (data: any | null) => void
) {
  return firestore()
    .collection('users')
    .doc(uid)
    .onSnapshot(
      snap => {
        if (!snap.exists) {
          onChange(null);
          return;
        }

        onChange({
          id: snap.id,
          ...snap.data(),
        });
      },
      error => {
              const msg = error?.message ?? '';

              if (msg.includes('permission-denied')) {
                // ✅ Expected during auth bootstrap
                console.log('[USER SERVICE] Firestore not ready yet');
                return;
              }

        console.error('[USER SERVICE] subscribe error', error);
      }
    );
}
