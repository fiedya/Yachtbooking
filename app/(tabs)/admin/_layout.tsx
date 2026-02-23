import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="all-users" options={{ title: "Uzytkownicy" }} />

      <Stack.Screen name="user-details" options={{ title: "Szczegóły użytkownika" }} />

      <Stack.Screen name="booking-details" options={{ title: "Szczegóły rezerwacji" }}/>

      <Stack.Screen name="all-bookings" options={{ title: "Wszystkie rezerwacje" }} />

      <Stack.Screen name="all-notes" options={{ title: "Notatki" }} />

      <Stack.Screen name="note-details" options={{ title: "Szczegóły notatki" }} />

      <Stack.Screen name="new-notes" options={{ title: "Nowe notatki" }} />
    </Stack>
  );
}
