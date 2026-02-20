import { User } from "@/src/entities/user";
import { useAuth } from "@/src/providers/AuthProvider";
import { subscribeToUser } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";

import Icon from "@/src/components/Icon";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useMode } from "../../src/providers/ModeProvider";

export default function TabsLayout() {
  const { mode } = useMode();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, uid, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);

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
