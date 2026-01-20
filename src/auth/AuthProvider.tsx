import { onAuthStateChanged } from '@/src/services/authService';
import { createContext, useContext, useEffect, useState } from 'react';

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

  useEffect(() => {
    let initialized = false;

    const unsub = onAuthStateChanged(u => {
      console.log('[AUTH PROVIDER]', {
        uid: u?.uid,
        phone: u?.phoneNumber,
      });

      setUser(u);
      setLoading(false);
      initialized = true;
    });

    return () => {
      if (initialized) {
        unsub();
      }
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
