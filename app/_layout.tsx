import { AuthProvider } from '@/src/auth/AuthProvider';
import { Stack } from 'expo-router';
import { ModeProvider } from './providers/ModeProvider';

export default function RootLayout() {
  return (
    <ModeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ModeProvider>
  );
}
