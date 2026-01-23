import { Stack } from 'expo-router';

export default function YachtsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="add-edit-yacht"
        options={{ title: 'Add/Edit Yacht' }}
      />

      <Stack.Screen
        name="yacht-details"
        options={{ title: 'Yacht details' }}
      />
    </Stack>
  );
}
