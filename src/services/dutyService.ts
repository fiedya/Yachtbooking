import { Duty, DutyOfficer } from "@/src/entities/duty";
import {
  addDocAuto,
  getDoc,
  onSnapshot,
  queryDocs,
  serverTimestamp,
  updateDoc,
} from "@/src/firebase/init";

/* ----------------------------------
   Coverage helpers
----------------------------------- */

function isFullyCovered(
  start: Date,
  end: Date,
  duties: Array<{ start: Date; end: Date }>,
): boolean {
  const sorted = [...duties].sort((a, b) => a.start.getTime() - b.start.getTime());
  let covered = start.getTime();
  for (const d of sorted) {
    if (d.start.getTime() > covered) return false;
    covered = Math.max(covered, d.end.getTime());
    if (covered >= end.getTime()) return true;
  }
  return covered >= end.getTime();
}

export async function checkDutyCoverage(start: Date, end: Date): Promise<boolean> {
  try {
    const snapshot: any = await queryDocs("duties", {
      where: [["start", "<", end]],
    });

    const docs = snapshot.docs ?? snapshot._docs ?? [];
    const duties = docs
      .filter((doc: any) => !doc.data().deleted)
      .map((doc: any) => {
        const d = doc.data();
        return { start: d.start.toDate(), end: d.end.toDate() };
      });

    return isFullyCovered(start, end, duties);
  } catch {
    return true; // fail open — don't block booking on query error
  }
}

export async function checkDutyOverlap(start: Date, end: Date, excludeId?: string): Promise<boolean> {
  const snapshot: any = await queryDocs("duties", {
    where: [["start", "<", end]],
  });
  const docs = snapshot.docs ?? snapshot._docs ?? [];
  const filtered = docs
    .filter((d: any) => !d.data().deleted)
    .filter((d: any) => !excludeId || d.id !== excludeId)
    .filter((d: any) => d.data().end.toDate() > start);
  return filtered.length > 0;
}

/* ----------------------------------
   Duty Officers
----------------------------------- */

export function subscribeToDutyOfficers(
  onChange: (officers: DutyOfficer[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "dutyOfficers",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }
      const docs = snapshot.docs ?? snapshot._docs ?? [];
      const officers: DutyOfficer[] = docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onChange(officers.sort((a, b) => a.name.localeCompare(b.name)));
    },
    onError,
  );
}

async function findOrCreateDutyOfficer(name: string, phone: string): Promise<string> {
  const snapshot: any = await queryDocs("dutyOfficers", {
    where: ["name", "==", name],
  });
  const docs = snapshot.docs ?? snapshot._docs ?? [];
  if (docs.length > 0) {
    return docs[0].id;
  }
  const ref = await addDocAuto("dutyOfficers", { name, phone });
  return ref.id;
}

/* ----------------------------------
   Duties CRUD
----------------------------------- */

export async function getDuty(dutyId: string): Promise<Duty | null> {
  const snap: any = await getDoc("duties", dutyId);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Duty;
}

export async function createDuty(params: {
  dutyOfficerName: string;
  dutyOfficerPhone: string;
  start: Date;
  end: Date;
}): Promise<void> {
  const hasOverlap = await checkDutyOverlap(params.start, params.end);
  if (hasOverlap) {
    throw new Error("OVERLAP");
  }

  const dutyOfficerId = await findOrCreateDutyOfficer(
    params.dutyOfficerName,
    params.dutyOfficerPhone,
  );

  await addDocAuto("duties", {
    dutyOfficerId,
    dutyOfficerName: params.dutyOfficerName,
    dutyOfficerPhone: params.dutyOfficerPhone,
    start: params.start,
    end: params.end,
    createdAt: serverTimestamp(),
  });
}

export async function updateDuty(dutyId: string, params: {
  dutyOfficerName: string;
  dutyOfficerPhone: string;
  start: Date;
  end: Date;
}): Promise<void> {
  const hasOverlap = await checkDutyOverlap(params.start, params.end, dutyId);
  if (hasOverlap) {
    throw new Error("OVERLAP");
  }

  const dutyOfficerId = await findOrCreateDutyOfficer(
    params.dutyOfficerName,
    params.dutyOfficerPhone,
  );

  await updateDoc("duties", dutyId, {
    dutyOfficerId,
    dutyOfficerName: params.dutyOfficerName,
    dutyOfficerPhone: params.dutyOfficerPhone,
    start: params.start,
    end: params.end,
  });
}

export async function softDeleteDuty(dutyId: string): Promise<void> {
  await updateDoc("duties", dutyId, { deleted: true });
}

export async function getDutyOfficersOnce(): Promise<DutyOfficer[]> {
  const snapshot: any = await queryDocs("dutyOfficers", {});
  const docs = snapshot.docs ?? snapshot._docs ?? [];
  return docs
    .map((doc: any) => ({ id: doc.id, ...doc.data() } as DutyOfficer))
    .sort((a: DutyOfficer, b: DutyOfficer) => a.name.localeCompare(b.name));
}

export async function getDutiesInRange(start: Date, end: Date): Promise<Duty[]> {
  const snapshot: any = await queryDocs("duties", {
    where: [["start", "<", end]],
  });
  const docs = snapshot.docs ?? snapshot._docs ?? [];
  return docs
    .filter((doc: any) => !doc.data().deleted)
    .filter((doc: any) => doc.data().end.toDate() > start)
    .map((doc: any) => ({ id: doc.id, ...doc.data() } as Duty));
}

/* ----------------------------------
   Subscriptions
----------------------------------- */

export function subscribeToWeekDuties(
  weekStart: Date,
  weekEnd: Date,
  onChange: (duties: Duty[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "duties",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }
      const docs = snapshot.docs ?? snapshot._docs ?? [];
      const duties: Duty[] = docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => !d.deleted)
        .filter((d: any) => {
          const s = d.start?.toDate?.();
          const e = d.end?.toDate?.();
          return s && e && s < weekEnd && e > weekStart;
        });
      onChange(duties);
    },
    onError,
    {
      where: [["start", "<", weekEnd]],
    },
  );
}
