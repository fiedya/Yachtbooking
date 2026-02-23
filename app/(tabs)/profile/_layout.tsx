import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="settings" options={{ title: "Ustawienia" }} />

      <Stack.Screen
        name="app-versioning"
        options={{ title: "Historia wersji" }}
      />
    </Stack>
  );
}
