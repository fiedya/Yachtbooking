import Icon from "@/src/components/Icon";
import { useAuth } from "@/src/providers/AuthProvider";
import { subscribeToUser } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles } from "@/src/theme/styles";
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

type NavTile = {
  label: string;
  description: string;
  route: string;
  icon: string;
};

const TILES: NavTile[] = [
  { label: "Użytkownicy", description: "Wszyscy członkowie klubu", route: "/admin/all-users", icon: "people-outline" },
  { label: "Nowi użytkownicy", description: "Oczekują na weryfikację", route: "/admin/users-to-verify", icon: "person-add-outline" },
  { label: "Wszystkie bookingi", description: "Historia rezerwacji", route: "/admin/all-bookings", icon: "calendar-outline" },
  { label: "Nowe bookingi", description: "Do zatwierdzenia", route: "/admin/bookings-to-approve", icon: "time-outline" },
  { label: "Notatki", description: "Wszystkie zgłoszenia", route: "/admin/all-notes", icon: "document-text-outline" },
  { label: "Nowe notatki", description: "Nieodczytane zgłoszenia", route: "/admin/new-notes", icon: "notifications-outline" },
];

export default function AdminScreen() {
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
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Panel Admina",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {TILES.map((tile) => (
          <Pressable
            key={tile.route}
            onPress={() => router.push(tile.route as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.backgroundSoft,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={tile.icon} size={22} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.textPrimary, { fontWeight: "600" }]}>{tile.label}</Text>
              <Text style={styles.textSecondary}>{tile.description}</Text>
            </View>
            <Icon name="chevron-forward-outline" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
