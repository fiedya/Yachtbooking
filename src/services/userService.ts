import {
    getDoc,
    onDocSnapshot,
    onSnapshot,
    queryDocs,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "@/src/firebase/init";
import { User, UserStatus } from "../entities/user";

/* ----------------------------------
   Reads
----------------------------------- */

export async function getUserPhotoUrl(
  uid: string,
): Promise<string | null> {
  const snap: any = await getDoc("users", uid);

  if (!snap.exists()) return null;
  return snap.data()?.photoUrl ?? null;
}

export async function getUser(uid: string) {
  const snap: any = await getDoc("users", uid);
  return snap.exists() ? snap.data() : null;
}

/* ----------------------------------
   Writes
----------------------------------- */

export async function createOrUpdateUser(
  uid: string,
  phone: string,
  name: string,
  surname: string,
  pseudonim?: string,
) {
  const snap: any = await getDoc("users", uid);

  if (!snap.exists()) {
    await setDoc("users", uid, {
      uid,
      phone,
      name,
      surname,
      pseudonim: pseudonim || "",
      description: "",
      photoUrl: null,
      role: "user",
      status: 0,
      onboarded: true,
      createdAt: serverTimestamp(),
      preferences: {
        usePseudonims: false,
        useYachtShortcuts: false,
      },
    });
  } else {
    await updateDoc("users", uid, {
      name,
      surname,
      onboarded: true,
    });
  }
}

export async function updateUserPreferences(
  uid: string,
  preferences: Partial<{
    usePseudonims: boolean;
    useYachtShortcuts: boolean;
  }>,
) {
  return setDoc("users", uid, { preferences }, { merge: true });
}

export async function updateUserProfile(
  uid: string,
  data: { description?: string; pseudonim?: string },
) {
  return updateDoc("users", uid, data);
}

/* ----------------------------------
   Realtime subscription
----------------------------------- */


export function subscribeToUser(
  uid: string,
  onChange: (user: User | null) => void,
) {
  if (!uid) {
    onChange(null);
    return () => {};
  }

  return onDocSnapshot(
    "users",
    uid,
    (snap: any) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }

      onChange({
        uid: snap.id,
        ...(snap.data() as Omit<User, "uid">),
      });
    },
    (error: any) => {
      const msg = error?.message ?? "";
      if (!msg.includes("permission-denied")) {
        console.error("[USER SERVICE] subscribe error", error);
      }
      onChange(null);
    },
  );
}

export function subscribeToAllUsers(
  onChange: (users: User[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "users",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];

      const users: User[] = docs
        .map((doc: any) => ({
          uid: doc.id,
          ...(doc.data() as Omit<User, "uid">),
        }))
        .sort((a: { surname: any; }, b: { surname: any; }) =>
          (b.surname ?? "").localeCompare(a.surname ?? ""),
        );

      onChange(users);
    },
    onError,
  );
}


export function subscribeToUsersToVerify(
  onChange: (users: User[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "users",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];

      const users: User[] = docs
        .map((doc: any) => ({
          uid: doc.id,
          ...(doc.data() as Omit<User, "uid">),
        }))
        .sort((a: { surname: any; }, b: { surname: any; }) =>
          (b.surname ?? "").localeCompare(a.surname ?? ""),
        );

      onChange(users);
    },
    onError,
    {
      where: ["status", "==", UserStatus.ToVerify],
      orderBy: ["surname", "desc"],
    },
  );
}

type SharedUsersListener = {
  onChange: (users: User[]) => void;
  onError?: (error: unknown) => void;
};

type SharedUsersCache = {
  unsub: (() => void) | null;
  users: User[];
  listeners: Set<SharedUsersListener>;
};

const sharedAllUsersCache: SharedUsersCache = {
  unsub: null,
  users: [],
  listeners: new Set<SharedUsersListener>(),
};

const sharedUsersToVerifyCache: SharedUsersCache = {
  unsub: null,
  users: [],
  listeners: new Set<SharedUsersListener>(),
};

function subscribeToSharedUsersCache(
  cache: SharedUsersCache,
  subscribeFactory: (
    onChange: (users: User[]) => void,
    onError?: (error: unknown) => void,
  ) => () => void,
  onChange: (users: User[]) => void,
  onError?: (error: unknown) => void,
) {
  if (!cache.unsub) {
    cache.unsub = subscribeFactory(
      (users) => {
        cache.users = users;
        cache.listeners.forEach((listener) => {
          listener.onChange(users);
        });
      },
      (error) => {
        cache.listeners.forEach((listener) => {
          listener.onError?.(error);
        });
      },
    );
  }

  const listener: SharedUsersListener = { onChange, onError };
  cache.listeners.add(listener);
  onChange(cache.users);

  return () => {
    cache.listeners.delete(listener);
  };
}

export function subscribeToAllUsersShared(
  onChange: (users: User[]) => void,
  onError?: (error: unknown) => void,
) {
  return subscribeToSharedUsersCache(
    sharedAllUsersCache,
    (nextOnChange, nextOnError) =>
      subscribeToAllUsers(nextOnChange, nextOnError),
    onChange,
    onError,
  );
}

export function subscribeToUsersToVerifyShared(
  onChange: (users: User[]) => void,
  onError?: (error: unknown) => void,
) {
  return subscribeToSharedUsersCache(
    sharedUsersToVerifyCache,
    (nextOnChange, nextOnError) =>
      subscribeToUsersToVerify(nextOnChange, nextOnError),
    onChange,
    onError,
  );
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus.Verified | UserStatus.Rejected,
) {
  return updateDoc("users", userId, { status });
}


export async function updateUserAvatar(
  userId: string,
  photoUrl: string,
) {
  return updateDoc("users", userId, { photoUrl });
}

export async function probeUserPermissions(userId: string) {
  try {
    await getDoc("settings", userId);
    console.log("[DEBUG] settings OK");
  } catch (e: any) {
    console.log("[DEBUG] settings FAIL", e?.code ?? e);
  }

  try {
    await queryDocs("bookings", { limit: 1 });
    console.log("[DEBUG] bookings OK");
  } catch (e: any) {
    console.log("[DEBUG] bookings FAIL", e?.code ?? e);
  }
}