import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeContext";
import { subscribeToUser } from "@/src/services/userService";
import { createHeaderStyles } from "@/src/theme/header";
import { createStyles } from "@/src/theme/styles";
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

export default function AdminScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const headerStyles = createHeaderStyles(colors);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { mode } = useMode();
  const { user, uid, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (authLoading) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    const unsub = subscribeToUser(user.uid, (profile) => {
      if (profile?.role !== "admin" || mode !== "admin") {
        router.replace("/(tabs)/calendar");
      }
    });

    return unsub;
  }, [rootNavigationState?.key, authLoading, user?.uid, mode, router]);

  return (
    <View style={styles.screenPadded}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Admin",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />
      <Pressable
        style={[styles.button, { marginBottom: 12 }]}
        onPress={() => router.push("/admin/all-users")}>
        <Text style={styles.buttonText}>Użytkownicy</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { marginBottom: 12 }]}
        onPress={() => router.push("/admin/users-to-verify")} >
        <Text style={styles.buttonText}>Nowi użytkownicy</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { marginTop: 12 }]}
        onPress={() => router.push("/admin/all-bookings")}>
        <Text style={styles.buttonText}>Wszystkie bookingi</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { marginTop: 12 }]}
        onPress={() => router.push("/admin/bookings-to-approve")}
      >
        <Text style={styles.buttonText}>Nowe bookingi</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { marginTop: 12 }]}
        onPress={() => router.push("/admin/all-notes")}
      >
        <Text style={styles.buttonText}>Notatki</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { marginTop: 12 }]}
        onPress={() => router.push("/admin/new-notes")}
      >
        <Text style={styles.buttonText}>Nowe notatki</Text>
      </Pressable>


    </View>
  );
}
