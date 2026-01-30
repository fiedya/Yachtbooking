import { User } from "@/src/entities/user";
import { subscribeToUser } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useMode } from "../providers/ModeProvider";

export default function TabsLayout() {
  const { mode } = useMode();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const user = auth().currentUser;

    useEffect(() => {
    const user = auth().currentUser;
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
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="yachts"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="boat-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="book"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href:
            isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="key-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
