import {
    addDocAuto,
    getDoc,
    onSnapshot,
    queryDocs,
    serverTimestamp,
    updateDoc,
} from "@/src/firebase/init";
import { Yacht, YachtStatus } from "../entities/yacht";

/* ----------------------------------
   Reads
----------------------------------- */

export async function getYachts(): Promise<Yacht[]> {
  const snap: any = await queryDocs("yachts", {});
  const docs = snap.docs ?? snap._docs ?? [];

  return docs
    .map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<Yacht, "id">),
    }))
    .filter((yacht: { status: YachtStatus; }) => yacht.status === YachtStatus.Available);
}

export function subscribeToYachts(
  onChange: (yachts: Yacht[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "yachts",
    (snapshot: any) => {
      const docs = snapshot?.docs ?? snapshot?._docs ?? [];

      const yachts = docs.map((d: any) => ({
        id: d.id,
        ...(d.data() as Omit<Yacht, "id">),
      }));

      onChange(yachts);
    },
    onError,
  );
}

export function subscribeToAvailableYachts(
  onChange: (yachts: Yacht[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "yachts",
    (snapshot: any) => {
      const docs = snapshot?.docs ?? snapshot?._docs ?? [];

      const yachts = docs.map((d: any) => ({
        id: d.id,
        ...(d.data() as Omit<Yacht, "id">),
      }));

      onChange(yachts);
    },
    onError,
    {
      where: ["status", "==", YachtStatus.Available],
    },
  );
}

export async function getYachtById(id: string): Promise<Yacht | null> {
  const snap: any = await getDoc("yachts", id);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<Yacht, "id">),
  };
}

/* ----------------------------------
   Writes
----------------------------------- */

export async function addYacht(
  data: Omit<Yacht, "id" | "createdAt">,
) {
  return addDocAuto("yachts", {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateYacht(
  id: string,
  data: Partial<Omit<Yacht, "id" | "createdAt">>,
) {
  return updateDoc("yachts", id, data);
}

export async function setYachtActive(
  yachtId: string,
  active: boolean,
) {
  return updateDoc("yachts", yachtId, { active });
}

/* ----------------------------------
   Queries
----------------------------------- */

export async function getAvailableYachts(): Promise<Yacht[]> {
  const snap: any = await queryDocs("yachts", {
    where: ["status", "==", YachtStatus.Available],
  });

  const docs = snap.docs ?? snap._docs ?? [];

  return docs.map((d: any) => ({
    id: d.id,
    ...(d.data() as Omit<Yacht, "id">),
  }));
}

export async function getAllYachts(): Promise<Yacht[]> {
  return getYachts();
}
