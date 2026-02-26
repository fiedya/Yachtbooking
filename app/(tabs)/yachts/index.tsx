import Icon from "@/src/components/Icon";
import { Yacht, YachtStatus } from "@/src/entities/yacht";
import { getYachtStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToYachts } from "@/src/services/yachtService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

export default function YachtsScreen() {
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<YachtStatus | "all">(YachtStatus.Available);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const statusOptions: Array<{ value: YachtStatus | "all"; label: string }> = [
    { value: "all", label: "Wszystkie statusy" },
    { value: YachtStatus.Available, label: getYachtStatusLabel(YachtStatus.Available) },
    { value: YachtStatus.Maintenance, label: getYachtStatusLabel(YachtStatus.Maintenance) },
    { value: YachtStatus.Disabled, label: getYachtStatusLabel(YachtStatus.Disabled) },
    { value: YachtStatus.NotOurs, label: getYachtStatusLabel(YachtStatus.NotOurs) },
  ];

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

  const selectedStatusLabel = statusOptions.find(
    (option) => option.value === selectedStatus,
  )?.label;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Jachty",
          headerRight: () => (
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 8,
              }}
              onPress={() => setShowStatusDropdown((prev) => !prev)}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  marginRight: 2,
                }}
              >
                {selectedStatusLabel}
              </Text>
              <Icon
                type="material"
                name={showStatusDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={20}
                color={colors.primary}
              />
            </Pressable>
          ),
        }}
      />

      {showStatusDropdown && (
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 20,
            minWidth: 180,
          }}
        >
          <View
            style={[
              theme.card,
              {
                backgroundColor: colors.white,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            {statusOptions.map((option) => {
              const isSelected = option.value === selectedStatus;
              return (
                <Pressable
                  key={String(option.value)}
                  onPress={() => {
                    setSelectedStatus(option.value);
                    setShowStatusDropdown(false);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: isSelected
                      ? colors.primaryLight
                      : colors.white,
                  }}
                >
                  <Text
                    style={[
                      theme.bodyText,
                      isSelected && { color: colors.primary, fontWeight: "600" },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <FlatList
        data={yachts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={theme.listPadding}
        ListEmptyComponent={
          <Text style={theme.textMuted}>Brak jachtów dla wybranego statusu</Text>
        }
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
          <Icon name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </>
  );
}
