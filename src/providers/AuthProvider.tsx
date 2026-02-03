import { auth } from "@/src/firebase/auth";
import { useMode } from "@/src/providers/ModeProvider";
import { subscribeToUser } from "@/src/services/userService";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextValue = {
  user: any | null;   // Firebase User (web or native)
  uid: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  uid: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { setMode } = useMode();

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((u: any | null) => {
      // cleanup previous Firestore subscription
      unsubscribeUserDoc?.();
      unsubscribeUserDoc = undefined;

      if (!u || !u.uid) {
        setUser(null);
        setMode("user");
        setLoading(false);
        return;
      }

      setUser(u);

      // subscribe to user profile (role, etc.)
      unsubscribeUserDoc = subscribeToUser(u.uid, (profile) => {
        setMode(profile?.role === "admin" ? "admin" : "user");
      });

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc?.();
    };
  }, [setMode]);

  return (
    <AuthContext.Provider
      value={{
        user,
        uid: user?.uid ?? null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
