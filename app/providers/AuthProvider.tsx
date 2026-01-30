import { useMode } from "@/app/providers/ModeProvider";
import { subscribeToUser } from "@/src/services/userService";
import auth from "@react-native-firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<{
  user: any | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { setMode } = useMode(); // 👈 NEW

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = auth().onAuthStateChanged((u) => {
      console.log("[AUTH PROVIDER] state changed:", {
        uid: u?.uid,
        phone: u?.phoneNumber,
      });

      // 🔁 cleanup previous Firestore subscription
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = undefined;
      }

      if (!u) {
        setUser(null);
        setMode("user"); // ✅ reset on logout
        setLoading(false);
        return;
      }

      setUser(u);

      // 🔥 subscribe to Firestore user profile
      unsubscribeUserDoc = subscribeToUser(u.uid, (profile) => {
        if (!profile) return;

        if (profile.role === "admin") {
          setMode("admin");
        } else {
          setMode("user");
        }
      });

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
