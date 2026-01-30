// Get only the user's photoUrl by UID

import firestore from "@react-native-firebase/firestore";

export async function getUserPhotoUrl(uid: string): Promise<string | null> {
  const ref = firestore().collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data();
  return data && data.photoUrl ? data.photoUrl : null;
}

export async function getUser(uid: string) {
  console.log("[USER SERVICE] getUser uid:", uid);

  const ref = firestore().collection("users").doc(uid);
  const snap = await ref.get();
  return snap.exists() ? snap.data() : null;
}

export async function createOrUpdateUser(
  uid: string,
  phone: string,
  name: string,
  surname: string,
) {
  const ref = firestore().collection("users").doc(uid);
  const snap = await ref.get();

  if (!snap.exists()) {
    await ref.set({
      uid,
      phone,
      name,
      surname,
      description: "",
      photoUrl: null,
      role: "user",
      status: 0, // UserStatus.ToVerify
      onboarded: true,
      createdAt: firestore.FieldValue.serverTimestamp(),
      preferences: {
        usePseudonims: false,
        useYachtShortcuts: false,
      },
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
  surname?: string,
) {
  const ref = firestore().collection("users").doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      uid,
      phone,
      name: name ?? "",
      surname: surname ?? "",
      description: "",
      pseudonim: "",
      photoUrl: null,
      role: "user",
      status: 0, // UserStatus.ToVerify
      onboarded: !!(name && surname),
      createdAt: firestore.FieldValue.serverTimestamp(),
      preferences: {
        usePseudonims: false,
        useYachtShortcuts: false,
      },
    });
  } else if (name && surname) {
    await ref.update({
      name,
      surname,
      onboarded: true,
    });
  }
}

// Update user preferences
export async function updateUserPreferences(
  uid: string,
  preferences: Partial<{ usePseudonims: boolean; useYachtShortcuts: boolean }>,
) {
  const ref = firestore().collection("users").doc(uid);
  await ref.set({ preferences }, { merge: true });
}

export async function updateUserProfile(
  uid: string,
  data: { description?: string; pseudonim?: string },
) {
  const ref = firestore().collection("users").doc(uid);
  await ref.update(data);
}

export function subscribeToUser(
  uid: string,
  onChange: (data: any | null) => void,
) {
  return firestore()
    .collection("users")
    .doc(uid)
    .onSnapshot(
      (snap) => {
        if (!snap.exists) {
          onChange(null);
          return;
        }

        onChange({
          id: snap.id,
          ...snap.data(),
        });
      },
      (error) => {
        const msg = error?.message ?? "";

        if (msg.includes("permission-denied")) {
          console.log("[USER SERVICE] Firestore not ready yet");
          return;
        }

        console.error("[USER SERVICE] subscribe error", error);
      },
    );
}
