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
  yachtIds: string[];
  yachtNames: string[];
  start: Date;
  end: Date;
}) {
  return addDocAuto("bookings", {
    userId: params.userId,
    userName: params.userName,
    yachtIds: params.yachtIds,
    yachtNames: params.yachtNames,
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
        .sort(
          (a: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }, b: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }) =>
            a.start?.toDate?.()?.getTime?.() -
            b.start?.toDate?.()?.getTime?.(),
        );

      onChange(bookings);
    },
    onError,
    {
      where: ["status", "==", BookingStatus.Pending],
    },
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
    {
      orderBy: ["start", "asc"],
    },
  );
}

export function subscribeToUpcomingBookings(
  rangeStart: Date,
  rangeEnd: Date,
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
          (a: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }, b: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }) =>
            a.start?.toDate?.()?.getTime?.() -
            b.start?.toDate?.()?.getTime?.(),
        );

      onChange(bookings);
    },
    onError,
    {
      where: [
        ["start", ">=", rangeStart],
        ["start", "<", rangeEnd],
      ],
      orderBy: ["start", "asc"],
    },
  );
}

export function subscribeToUpcomingPendingBookings(
  rangeStart: Date,
  rangeEnd: Date,
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
          (a: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }, b: { start: { toDate: () => { (): any; new(): any; getTime: { (): number; new(): any; }; }; }; }) =>
            a.start?.toDate?.()?.getTime?.() -
            b.start?.toDate?.()?.getTime?.(),
        );

      onChange(bookings);
    },
    onError,
    {
      where: [
        ["status", "==", BookingStatus.Pending],
        ["start", ">=", rangeStart],
        ["start", "<", rangeEnd],
      ],
      orderBy: ["start", "asc"],
    },
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
    {
      where: [
        ["start", "<", weekEnd],
        ["end", ">", weekStart],
      ],
    },
  );
}

type SharedWeekListener = {
  onChange: (bookings: Booking[]) => void;
  onError?: (error: unknown) => void;
};

type SharedRangeState = {
  rangeStart: Date | null;
  rangeEnd: Date | null;
  unsub: (() => void) | null;
  bookings: Booking[];
  listeners: Set<SharedWeekListener>;
  initialized: boolean;
};

const USER_BACK_WEEKS = 2;
const USER_AHEAD_WEEKS = 2;
const ADMIN_BACK_WEEKS = 2;
const ADMIN_AHEAD_MONTHS = 1;
const SHARED_BOOKINGS_DEBUG = true;

const sharedUserState: SharedRangeState = {
  rangeStart: null,
  rangeEnd: null,
  unsub: null,
  bookings: [],
  listeners: new Set<SharedWeekListener>(),
  initialized: false,
};

const sharedAdminState: SharedRangeState = {
  rangeStart: null,
  rangeEnd: null,
  unsub: null,
  bookings: [],
  listeners: new Set<SharedWeekListener>(),
  initialized: false,
};

function formatYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sharedLog(message: string, extra?: Record<string, unknown>) {
  if (!SHARED_BOOKINGS_DEBUG) {
    return;
  }

  if (extra) {
    console.log(`[BOOKINGS SHARED] ${message}`, extra);
    return;
  }

  console.log(`[BOOKINGS SHARED] ${message}`);
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function emitRangeBookings(state: SharedRangeState, role: "user" | "admin") {
  const sorted = [...state.bookings].sort(
    (a, b) =>
      a.start?.toDate?.()?.getTime?.() -
      b.start?.toDate?.()?.getTime?.(),
  );

  state.listeners.forEach((listener) => {
    listener.onChange(sorted);
  });

  sharedLog("emit shared range", {
    role,
    totalBookings: sorted.length,
    activeScreenListeners: state.listeners.size,
    rangeStart: state.rangeStart ? formatYmd(state.rangeStart) : null,
    rangeEnd: state.rangeEnd ? formatYmd(state.rangeEnd) : null,
  });
}

function subscribeToRangeBookings(
  rangeStart: Date,
  rangeEnd: Date,
  includeRejected: boolean,
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
        .filter((b) => {
          const start = asDate(b.start);
          const end = asDate(b.end);
          return start && end && start < rangeEnd && end > rangeStart;
        });

      onChange(bookings);
    },
    onError,
    {
      where: includeRejected
        ? [
            ["start", "<", rangeEnd],
            ["end", ">", rangeStart],
          ]
        : [
            ["start", "<", rangeEnd],
            ["end", ">", rangeStart],
            [
              "status",
              "in",
              [
                BookingStatus.Pending,
                BookingStatus.Approved,
                BookingStatus.Cancelled,
              ],
            ],
          ],
    },
  );
}

function getBaseWindow(role: "user" | "admin") {
  const today = new Date();
  const start = startOfWeek(addDays(
    today,
    -7 * (role === "admin" ? ADMIN_BACK_WEEKS : USER_BACK_WEEKS),
  ));

  const end = role === "admin"
    ? addMonths(today, ADMIN_AHEAD_MONTHS)
    : addDays(today, 7 * USER_AHEAD_WEEKS);

  return {
    start,
    end: addDays(startOfWeek(end), 7),
  };
}

function ensureRangeListener(
  state: SharedRangeState,
  role: "user" | "admin",
  requiredStart: Date,
  requiredEnd: Date,
) {
  const normalizedRequiredStart = startOfWeek(requiredStart);
  const normalizedRequiredEnd = addDays(startOfWeek(requiredEnd), 7);

  if (!state.initialized || !state.rangeStart || !state.rangeEnd) {
    const base = getBaseWindow(role);
    state.rangeStart = base.start;
    state.rangeEnd = base.end;
    state.initialized = true;

    sharedLog("initialize shared range", {
      role,
      rangeStart: formatYmd(state.rangeStart),
      rangeEnd: formatYmd(state.rangeEnd),
    });
  }

  let nextStart = state.rangeStart;
  let nextEnd = state.rangeEnd;
  let changed = false;

  if (normalizedRequiredStart < nextStart) {
    nextStart = normalizedRequiredStart;
    changed = true;
  }

  if (normalizedRequiredEnd > nextEnd) {
    nextEnd = normalizedRequiredEnd;
    changed = true;
  }

  if (!state.unsub || changed) {
    state.unsub?.();
    state.unsub = null;
    state.rangeStart = nextStart;
    state.rangeEnd = nextEnd;

    sharedLog("connect/reconnect shared range", {
      role,
      rangeStart: formatYmd(nextStart),
      rangeEnd: formatYmd(nextEnd),
      includeRejected: role === "admin",
    });

    state.unsub = subscribeToRangeBookings(
      nextStart,
      nextEnd,
      role === "admin",
      (bookings) => {
        state.bookings = bookings;
        emitRangeBookings(state, role);
      },
      (error) => {
        state.listeners.forEach((listener) => {
          listener.onError?.(error);
        });
      },
    );
  }
}

export function subscribeToSharedWeekBookings(
  weekStart: Date,
  weekEnd: Date,
  onChange: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void,
  options?: {
    isAdmin?: boolean;
  },
) {
  const listener: SharedWeekListener = { onChange, onError };

  const role: "user" | "admin" = options?.isAdmin ? "admin" : "user";
  const state = role === "admin" ? sharedAdminState : sharedUserState;

  ensureRangeListener(state, role, weekStart, weekEnd);

  state.listeners.add(listener);
  sharedLog("screen subscribed", {
    role,
    requestedWeekStart: formatYmd(weekStart),
    requestedWeekEnd: formatYmd(weekEnd),
    activeScreenListeners: state.listeners.size,
  });
  onChange(state.bookings);

  return () => {
    state.listeners.delete(listener);
    sharedLog("screen unsubscribed", {
      role,
      activeScreenListeners: state.listeners.size,
    });
  };
}

type SharedRangeListener = {
  onChange: (bookings: Booking[]) => void;
  onError?: (error: unknown) => void;
};

type SharedRangeCache = {
  unsub: (() => void) | null;
  data: Booking[];
  listeners: Set<SharedRangeListener>;
};

const sharedUpcomingByKey = new Map<string, SharedRangeCache>();
const sharedUpcomingPendingByKey = new Map<string, SharedRangeCache>();

function buildRangeKey(rangeStart: Date, rangeEnd: Date) {
  return `${rangeStart.getTime()}-${rangeEnd.getTime()}`;
}

function subscribeToSharedRangeMap(
  map: Map<string, SharedRangeCache>,
  key: string,
  subscribeFactory: (
    onChange: (bookings: Booking[]) => void,
    onError?: (error: unknown) => void,
  ) => () => void,
  onChange: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void,
) {
  let cache = map.get(key);

  if (!cache) {
    cache = {
      unsub: null,
      data: [],
      listeners: new Set<SharedRangeListener>(),
    };
    map.set(key, cache);

    cache.unsub = subscribeFactory(
      (bookings) => {
        cache!.data = bookings;
        cache!.listeners.forEach((listener) => {
          listener.onChange(bookings);
        });
      },
      (error) => {
        cache!.listeners.forEach((listener) => {
          listener.onError?.(error);
        });
      },
    );
  }

  const listener: SharedRangeListener = { onChange, onError };
  cache.listeners.add(listener);
  onChange(cache.data);

  return () => {
    cache!.listeners.delete(listener);
  };
}

export function subscribeToUpcomingBookingsShared(
  rangeStart: Date,
  rangeEnd: Date,
  onChange: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void,
) {
  const key = buildRangeKey(rangeStart, rangeEnd);

  return subscribeToSharedRangeMap(
    sharedUpcomingByKey,
    key,
    (nextOnChange, nextOnError) =>
      subscribeToUpcomingBookings(rangeStart, rangeEnd, nextOnChange, nextOnError),
    onChange,
    onError,
  );
}

export function subscribeToUpcomingPendingBookingsShared(
  rangeStart: Date,
  rangeEnd: Date,
  onChange: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void,
) {
  const key = buildRangeKey(rangeStart, rangeEnd);

  return subscribeToSharedRangeMap(
    sharedUpcomingPendingByKey,
    key,
    (nextOnChange, nextOnError) =>
      subscribeToUpcomingPendingBookings(rangeStart, rangeEnd, nextOnChange, nextOnError),
    onChange,
    onError,
  );
}

