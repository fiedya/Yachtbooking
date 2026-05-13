import Icon from "@/src/components/Icon";
import { Yacht, YachtStatus } from "@/src/entities/yacht";
import { getYachtStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToYachts } from "@/src/services/yachtService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

const STATUS_TABS: Array<{ value: YachtStatus | "all"; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: YachtStatus.Available, label: getYachtStatusLabel(YachtStatus.Available) },
  { value: YachtStatus.Maintenance, label: getYachtStatusLabel(YachtStatus.Maintenance) },
  { value: YachtStatus.Disabled, label: getYachtStatusLabel(YachtStatus.Disabled) },
  { value: YachtStatus.NotOurs, label: getYachtStatusLabel(YachtStatus.NotOurs) },
];

function YachtStatusBadge({ status }: { status: YachtStatus }) {
  const label = getYachtStatusLabel(status);
  let bg = colors.lightGrey;
  let fg = colors.textSecondary;
  if (status === YachtStatus.Available) { bg = colors.secondary; fg = colors.white; }
  if (status === YachtStatus.Maintenance) { bg = "#FFF3CD"; fg = "#856404"; }
  if (status === YachtStatus.Disabled) { bg = colors.dangerSoft; fg = colors.danger; }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: fg }}>{label}</Text>
    </View>
  );
}

export default function YachtsScreen() {
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<YachtStatus | "all">(YachtStatus.Available);
  const { mode } = useMode();
  const isAdmin = mode === "admin";

  const yachts =
    selectedStatus === "all"
      ? allYachts
      : allYachts.filter((y) => y.status === selectedStatus);

  useEffect(() => {
    const unsub = subscribeToYachts((allYachts) => {
      setAllYachts(allYachts);
    });
    return unsub;
  }, []);

  return (
    <View style={theme.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Jachty",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />

      {/* Filter tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(item) => String(item.value)}
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52, borderBottomWidth: 1, borderColor: colors.border }}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: "center" }}
        renderItem={({ item }) => {
          const isActive = item.value === selectedStatus;
          return (
            <Pressable
              style={[theme.pill, isActive ? theme.pillActive : theme.pillDefault]}
              onPress={() => setSelectedStatus(item.value)}
            >
              <Text style={{ color: isActive ? colors.white : colors.textSecondary, fontSize: 13 }}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Yacht list */}
      <FlatList
        data={yachts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 12 }}
        ListEmptyComponent={
          <View style={[theme.center, { paddingTop: 40 }]}>
            <Text style={theme.textMuted}>Brak jachtów dla wybranego statusu</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={{
              backgroundColor: colors.backgroundSoft,
              borderRadius: 12,
              overflow: "hidden",
            }}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/yachts/yacht-details",
                params: { id: item.id },
              })
            }
          >
            <Image
              source={
                item.imageUrl
                  ? { uri: item.imageUrl }
                  : require("@/assets/images/yacht_placeholder.png")
              }
              style={{ width: "100%", height: 180 }}
              resizeMode="cover"
            />
            <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[theme.textPrimary, { fontWeight: "700", fontSize: 16, marginBottom: 2 }]}>
                  {item.name}
                </Text>
                {!!item.shortcut && (
                  <Text style={theme.textSecondary}>{item.shortcut}</Text>
                )}
                {!!item.type && (
                  <Text style={theme.textSecondary}>{item.type}</Text>
                )}
              </View>
              {/* <YachtStatusBadge status={item.status} />
              <Icon name="chevron-forward-outline" size={18} color={colors.textMuted} /> */}
            </View>
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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
        >
          <Icon name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
