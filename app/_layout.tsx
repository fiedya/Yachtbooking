import { AuthProvider } from "@/src/providers/AuthProvider";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ModeProvider } from "../src/providers/ModeProvider";


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Ionicons: require("../assets/Ionicons.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ModeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ModeProvider>
  );
}