import {
  getDoc,
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
    where: ["start", "<", end],
  });

  const docs = snapshot.docs ?? snapshot._docs ?? [];
  const busyYachtIds = new Set<string>();

  docs.forEach((doc: any) => {
    const d = doc.data();

    if (
      d.start?.toDate?.() < end &&
      d.end?.toDate?.() > start &&
      [BookingStatus.Pending, BookingStatus.Approved].includes(d.status)
    ) {
      busyYachtIds.add(d.yachtId);
    }
  });

  // allow yacht of edited booking
  if (editingBookingId) {
    const editSnap: any = await getDoc("bookings", editingBookingId);

    if (editSnap.exists()) {
      const editingYachtId = editSnap.data()?.yachtId;
      if (editingYachtId) {
        busyYachtIds.delete(editingYachtId);
      }
    }
  }

  return Array.from(busyYachtIds);
}
