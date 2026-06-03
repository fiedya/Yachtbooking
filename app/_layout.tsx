import { AuthProvider } from "@/src/providers/AuthProvider";
import { PermissionsProvider } from "@/src/providers/PermissionsProvider";
import { CalendarModeProvider } from "@/src/providers/CalendarModeProvider";
import { VersionGateProvider } from "@/src/providers/VersionGateProvider";

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
        console.log('Expo push token:', token);
      }
    });
  }, []);

  return (
    <ModeProvider>
      <AuthProvider>
        <VersionGateProvider>
          <PermissionsProvider>
            <CalendarModeProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </CalendarModeProvider>
          </PermissionsProvider>
        </VersionGateProvider>
      </AuthProvider>
    </ModeProvider>
  );
}
