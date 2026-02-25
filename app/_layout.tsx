import { AuthProvider } from "@/src/providers/AuthProvider";
import { ThemeProvider } from "@/src/providers/ThemeContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ModeProvider } from "../src/providers/ModeProvider";


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Ionicons: require("../assets/Ionicons.ttf"),
  });

  return (
    <ThemeProvider>
      <ModeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </ModeProvider>
    </ThemeProvider>
  );
}