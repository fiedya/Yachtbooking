export async function updateYacht(
  id: string,
  data: Partial<Omit<Yacht, "id" | "createdAt">>,
) {
  return firestore().collection("yachts").doc(id).update(data);
}
// src/services/yachtService.ts

import firestore from "@react-native-firebase/firestore";
import { Yacht, YachtStatus } from "../entities/yacht";

/**
 * One-time fetch of all yachts
 */
export async function getYachts(): Promise<Yacht[]> {
  const snapshot = await firestore().collection("yachts").get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Yacht, "id">),
  }));
}

/**
 * Real-time subscription (optional, but nice)
 */

export function subscribeToYachts(
  onChange: (yachts: Yacht[]) => void,
  onError?: (error: unknown) => void,
) {
  return firestore()
    .collection("yachts")
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) {
          onChange([]);
          return;
        }

        const yachts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Yacht, "id">),
        }));

        onChange(yachts);
      },
      (error) => {
        console.error("Firestore yachts subscription error:", error);
        onError?.(error);
      },
    );
}

export async function getYachtById(id: string): Promise<Yacht | null> {
  const docSnap = await firestore().collection("yachts").doc(id).get();

  if (!docSnap.exists) {
    return null;
  }

  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<Yacht, "id">),
  };
}

export async function addYacht(
  data: Omit<Yacht, "id" | "createdAt">,
) {
  return firestore()
    .collection("yachts")
    .add({
      ...data,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
}

export async function setYachtActive(yachtId: string, active: boolean) {
  return firestore().collection("yachts").doc(yachtId).update({ active });
}


// Get only available yachts (status === YachtStatus.Available)
export async function getAvailableYachts(): Promise<Yacht[]> {
  const snap = await firestore()
    .collection("yachts")
    .where("status", "==", YachtStatus.Available)
    .get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Yacht[];
}

// Get all yachts except Disabled (status !== YachtStatus.Disabled)
export async function getOurYachts(): Promise<Yacht[]> {
  const snap = await firestore()
    .collection("yachts")
    .where("status", "!=", YachtStatus.Disabled)
    .get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Yacht[];
}

// Get all yachts (admin)
export async function getAllYachts(): Promise<Yacht[]> {
  const snap = await firestore()
    .collection("yachts")
    .get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Yacht[];
}
