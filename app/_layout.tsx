import { AuthProvider } from "@/src/providers/AuthProvider";

import { registerForPushNotificationsAsync } from "@/src/services/notificationService";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ModeProvider } from "../src/providers/ModeProvider";


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Ionicons: require("../assets/Ionicons.ttf"),
  });

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        // You can send this token to your backend if needed
        console.log('Expo push token:', token);
      }
    });
  }, []);

  return (
    <ModeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ModeProvider>
  );
}