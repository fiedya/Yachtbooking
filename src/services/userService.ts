import firestore from '@react-native-firebase/firestore';

export async function getUser(uid: string) {
  console.log('[USER SERVICE] getUser uid:', uid);

  const ref = firestore().collection('users').doc(uid);
  const snap = await ref.get();

  console.log('[USER SERVICE] getUser exists:', snap.exists());

  return snap.exists() ? snap.data() : null;
}

export async function createOrUpdateUser(
  uid: string,
  phone: string,
  name: string,
  surname: string
)
 {
  console.log('[USER SERVICE] createOrUpdateUser START', {
    uid,
    phone,
    name,
    surname,
  });

  const ref = firestore().collection('users').doc(uid);

  const snap = await ref.get();
  console.log('[USER SERVICE] user doc exists BEFORE write:', snap.exists());

  if (!snap.exists())
    {

      await ref.set({
        phone,
        name,
        surname,
        description: '',
        photoUrl: null,
        role: 'user',
        onboarded: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    } 
  else
    {
      console.log('[USER SERVICE] updating existing user document');

      await ref.update({
        name,
        surname,
        onboarded: true,
      });
    console.log('[USER SERVICE] user document UPDATED');
  }

  console.log('[USER SERVICE] createOrUpdateUser END');
}

export async function createUserIfMissing(
  uid: string,
  phone: string,
  name?: string,
  surname?: string
)
{
  const ref = firestore().collection('users').doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      phone,
      name: name ?? '',
      surname: surname ?? '',
      description: '',
      photoUrl: null,
      role: 'admin',
      onboarded: !!(name && surname),
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } else if (name && surname) {
    await ref.update({
      name,
      surname,
      onboarded: true,
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
        if (!snap.exists()) {
          onChange(null);
          return;
        }

        onChange({
          id: snap.id,
          ...snap.data(),
        });
        console.log('🔥 USER IMAGE:', snap.data()?.imageUrl);
      },
      error => {
        console.error('[USER SERVICE] subscribe error', error);
      }
    );
}
