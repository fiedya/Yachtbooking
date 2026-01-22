import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack initialRouteName="index">
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="all-users"
        options={{ title: 'All users' }}
      />
      <Stack.Screen
        name="users-to-verify"
        options={{ title: 'Users to verify' }}
      />
      <Stack.Screen
        name="bookings-to-approve"
        options={{ title: 'Bookings to approve' }}
      />
    </Stack>
  );
}
