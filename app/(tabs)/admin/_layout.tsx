import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="all-users"
        options={{ title: 'All users' }}
      />

      <Stack.Screen
        name="user-details"
        options={{ title: 'User details' }}
      />
    </Stack>
  );
}
