import { Stack } from "expo-router";

export default function NewsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="add-news" options={{ title: "Add News" }} />
    </Stack>
  );
}
