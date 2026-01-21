// app/providers/ModeProvider.tsx
import { createContext, useContext, useState } from 'react';

type Mode = 'user' | 'admin';

type ModeContextType = {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
};

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('user');

  function toggleMode() {
    setMode(prev => (prev === 'admin' ? 'user' : 'admin'));
  }

  return (
    <ModeContext.Provider value={{ mode, toggleMode, setMode }}>
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
