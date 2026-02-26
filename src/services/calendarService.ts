import {
    onSnapshot,
    queryDocs,
} from "@/src/firebase/init";
import { BookingStatus } from "../entities/booking";

/* ----------------------------------
   Realtime subscription
----------------------------------- */

export function subscribeToBookings(
  start: Date,
  end: Date,
  onChange: (bookings: any[]) => void,
  userId?: string,
) {
  return onSnapshot("bookings", async (snapshot: any) => {
    if (!snapshot) {
      onChange([]);
      return;
    }

    const docs = snapshot.docs ?? snapshot._docs ?? [];

    const data = docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(
        (b: any) =>
          b.start?.toDate?.() < end &&
          b.end?.toDate?.() > start &&
          [BookingStatus.Pending, BookingStatus.Approved].includes(b.status),
      );

    onChange(data);
  }, undefined, {
    where: userId
      ? [
          ["start", "<", end],
          ["userId", "==", userId],
          ["status", "in", [BookingStatus.Pending, BookingStatus.Approved]],
        ]
      : [
          ["start", "<", end],
          ["status", "in", [BookingStatus.Pending, BookingStatus.Approved]],
        ],
  });
}

/* ----------------------------------
   Availability query
----------------------------------- */

export async function getAvailableYachtIds(
  start: Date,
  end: Date,
  editingBookingId?: string | null,
): Promise<string[]> {
  const snapshot: any = await queryDocs("bookings", {
    where: [
      ["start", "<", end],
      ["status", "in", [BookingStatus.Pending, BookingStatus.Approved]],
    ],
  });

  const docs = snapshot.docs ?? snapshot._docs ?? [];
  const busyYachtIds = new Set<string>();

  docs.forEach((doc: any) => {
    if (editingBookingId && doc.id === editingBookingId) {
      return;
    }

    const d = doc.data();

    if (
      d.start?.toDate?.() < end &&
      d.end?.toDate?.() > start &&
      [BookingStatus.Pending, BookingStatus.Approved].includes(d.status)
    ) {
      const yachtIds = d.yachtIds ?? (d.yachtId ? [d.yachtId] : []);
      yachtIds.forEach((id: string) => busyYachtIds.add(id));
    }
  });

  return Array.from(busyYachtIds);
}
