import { AuthProvider } from "@/src/providers/AuthProvider";
import { Stack } from "expo-router";
import { ModeProvider } from "../src/providers/ModeProvider";

export default function RootLayout() {
  return (
    <ModeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ModeProvider>
  );
}
