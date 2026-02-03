import { Yacht, YachtStatus } from "@/src/entities/yacht";
import { useAuth } from "@/src/providers/AuthProvider";
import { subscribeToUser } from "@/src/services/userService";
import { subscribeToYachts } from "@/src/services/yachtService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Switch, Text, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

export default function YachtsScreen() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [showAll, setShowAll] = useState(false);
  const { mode } = useMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, uid, loading: authLoading } = useAuth();
  useEffect(() => {

    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);
  useEffect(() => {
    const unsub = subscribeToYachts((allYachts) => {
      if (showAll) {
        setYachts(allYachts);
      } else {
        setYachts(allYachts.filter((y) => y.status !== YachtStatus.Disabled));
      }
    });
    return unsub;
  }, [showAll]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Jachty",
          headerRight: isAdmin
            ? () => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "bold",
                      marginRight: 8,
                    }}
                  >
                    wszystkie
                  </Text>
                  <Switch
                    value={showAll}
                    onValueChange={setShowAll}
                    trackColor={{
                      false: colors.lightGrey,
                      true: colors.primary,
                    }}
                    thumbColor={showAll ? colors.primary : colors.primaryLight}
                  />
                </View>
              )
            : undefined,
        }}
      />

      <FlatList
        data={yachts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={theme.listPadding}
        renderItem={({ item }) => (
          <Pressable
            style={[
              theme.card,
              {
                backgroundColor: colors.lightGrey,
                borderColor: colors.primary,
                borderWidth: 1,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/yachts/yacht-details",
                params: { id: item.id },
              })
            }
          >
            <Image source={{ uri: item.imageUrl }} style={theme.cardImage} />
            <Text style={theme.cardTitle}>{item.name}</Text>
          </Pressable>
        )}
      />
      {isAdmin && (
        <Pressable
          onPress={() => router.push("/(tabs)/yachts/add-yacht")}
          style={{
            position: "absolute",
            right: 20,
            bottom: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            elevation: 4,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </>
  );
}
