import auth from '@react-native-firebase/auth';
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
    console.log(
      '[AUTH PROVIDER] currentUser on mount:',
      auth().currentUser?.uid ?? 'NO USER'
    );

    const unsubscribe = auth().onAuthStateChanged(u => {
      console.log('[AUTH PROVIDER] state changed:', {
        uid: u?.uid,
        phone: u?.phoneNumber,
      });

      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
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
