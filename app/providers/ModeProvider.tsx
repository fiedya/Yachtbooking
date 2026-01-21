import { createContext, ReactNode, useContext, useState } from 'react';

export type AppMode = 'user' | 'admin';

type ModeContextType = {
  mode: AppMode;
  toggleMode: () => void;
};

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('user');

  function toggleMode() {
    setMode(prev => (prev === 'user' ? 'admin' : 'user'));
  }

  return (
    <ModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useMode must be used inside ModeProvider');
  }
  return ctx;
}
