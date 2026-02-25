import { useTheme } from "@/src/providers/ThemeContext";

import Icon from "@/src/components/Icon";
import { Tabs } from "expo-router";
import { useMode } from "../../src/providers/ModeProvider";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { mode } = useMode();
  const isAdmin = mode === "admin";

  return (
    <Tabs
      initialRouteName="calendar"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="yachts"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="boat-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="book"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Icon name="key-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
