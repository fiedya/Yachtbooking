import { Booking, BookingStatus } from "@/src/entities/booking";
import { addDocAuto, onDocSnapshot, onSnapshot, serverTimestamp, updateDoc } from "@/src/firebase/init";

function asDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}


export async function createBooking(params: {
  userId: string;
  userName: string;
  yachtId: string;
  yachtName: string;
  start: Date;
  end: Date;
}) {
  return addDocAuto("bookings", {
    userId: params.userId,
    userName: params.userName,
    yachtId: params.yachtId,
    yachtName: params.yachtName,
    start: params.start,
    end: params.end,
    status: BookingStatus.Pending,
    createdAt: serverTimestamp(),
  });
}


export function subscribeToBooking(
  bookingId: string,
  onChange: (booking: Booking | null) => void,
) {
  if (!bookingId) {
    onChange(null);
    return () => {};
  }

  return onDocSnapshot(
    "bookings",
    bookingId,
    (snap: any) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }

      onChange({
        id: snap.id,
        ...(snap.data() as Omit<Booking, "id">),
      });
    },
    () => onChange(null),
  );
}


export async function updateBookingStatus(
  bookingId: string,
  status:
    | BookingStatus.Approved
    | BookingStatus.Rejected
    | BookingStatus.Cancelled,
) {
  return updateDoc("bookings", bookingId, { status });
}


export function subscribeToPendingBookings(
  onChange: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "bookings",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];

      const bookings: Booking[] = docs
        .map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Omit<Booking, "id">),
        }))
        // status == Pending
        .filter((b: { status: BookingStatus; }) => b.status === BookingStatus.Pending)
        // orderBy start asc
        .sort(
          (a: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }, b: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }) =>
            a.start?.toDate?.()?.getTime?.() -
            b.start?.toDate?.()?.getTime?.(),
        );

      onChange(bookings);
    },
    onError,
  );
}

export function subscribeToAllBookings(
  onChange: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "bookings",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];

      const bookings: Booking[] = docs
        .map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Omit<Booking, "id">),
        }))
        .sort(
          (
            a: {
              start: {
                toDate: () => { (): any; new (): any; getTime: { (): number; new (): any } };
              };
            },
            b: {
              start: {
                toDate: () => { (): any; new (): any; getTime: { (): number; new (): any } };
              };
            },
          ) =>
            a.start?.toDate?.()?.getTime?.() -
            b.start?.toDate?.()?.getTime?.(),
        );

      onChange(bookings);
    },
    onError,
  );
}


export function subscribeToWeekBookings(
  weekStart: Date,
  weekEnd: Date,
  onChange: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "bookings",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];

      const bookings: Booking[] = docs
        .map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Omit<Booking, "id">),
        }))
        .filter((b: { start: any; end: any; }) => {
          const start = asDate(b.start);
          const end = asDate(b.end);
          return (
            start &&
            end &&
            start < weekEnd &&
            end > weekStart
          );
        });

      onChange(bookings);
    },
    onError,
  );
}

