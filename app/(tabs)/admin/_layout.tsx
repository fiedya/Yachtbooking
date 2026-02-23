import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="all-users" options={{ title: "All users" }} />

      <Stack.Screen name="user-details" options={{ title: "User details" }} />

      <Stack.Screen name="booking-details" options={{ title: "Booking details" }}/>

      <Stack.Screen name="all-bookings" options={{ title: "All bookings" }} />

      <Stack.Screen name="all-notes" options={{ title: "Notes" }} />

      <Stack.Screen name="note-details" options={{ title: "Note details" }} />

      <Stack.Screen name="new-notes" options={{ title: "New notes" }} />
    </Stack>
  );
}
