import { Booking } from "@/src/entities/booking";
import { subscribeToAllBookings } from "@/src/services/booking.service";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

type SortOption = "yachtName" | "userName" | "createdAt" | "bookingDay";

export default function AllBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("bookingDay");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    const unsub = subscribeToAllBookings(
      (nextBookings) => {
        setBookings(nextBookings);
        setLoading(false);
      },
      (error) => {
        console.error("[ALL BOOKINGS] snapshot error:", error);
        setLoading(false);
      },
    );

    return unsub;
  }, []);

  const filteredAndSortedBookings = useMemo(() => {
    let result = [...bookings];

    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        (booking) =>
          (booking.userName ?? "").toLowerCase().includes(lowerSearch) ||
          (booking.yachtName ?? "").toLowerCase().includes(lowerSearch),
      );
    }

    result.sort((a, b) => {
      if (sortBy === "yachtName") {
        return (a.yachtName ?? "").localeCompare(b.yachtName ?? "");
      }
      if (sortBy === "userName") {
        return (a.userName ?? "").localeCompare(b.userName ?? "");
      }
      if (sortBy === "createdAt") {
        const aTime = a.createdAt?.toDate?.().getTime?.() ?? 0;
        const bTime = b.createdAt?.toDate?.().getTime?.() ?? 0;
        return bTime - aTime;
      }

      const aStart = a.start?.toDate?.().getTime?.() ?? 0;
      const bStart = b.start?.toDate?.().getTime?.() ?? 0;
      return bStart - aStart;
    });

    return result;
  }, [bookings, searchText, sortBy]);

  const SortButton = ({ value, label }: { value: SortOption; label: string }) => (
    <Pressable
      onPress={() => setSortBy(value)}
      style={[
        theme.pill,
        {
          paddingVertical: 6,
          paddingHorizontal: 12,
          backgroundColor: sortBy === value ? colors.primary : colors.lightGrey,
          marginRight: 8,
          marginBottom: 8,
        },
      ]}
    >
      <Text style={{ color: colors.white, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={theme.screen}>
      <View
        style={{
          padding: 12,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.lightGrey,
        }}
      >
        <TextInput
          placeholder="Szukaj po rezerwującym lub jachcie..."
          value={searchText}
          onChangeText={setSearchText}
          style={[
            theme.input,
            {
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.lightGrey,
              borderRadius: 6,
              marginBottom: 12,
            },
          ]}
          placeholderTextColor={colors.textMuted}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <SortButton value="yachtName" label="Jacht" />
          <SortButton value="userName" label="Rezerwujący" />
          <SortButton value="createdAt" label="Data utworzenia" />
          <SortButton value="bookingDay" label="Dzień rezerwacji" />
        </View>
      </View>

      <FlatList
        contentContainerStyle={theme.listPadding}
        data={filteredAndSortedBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/admin/booking-details",
                params: { bookingId: item.id },
              })
            }
          >
            <View style={[theme.card, theme.cardPadding]}>
              <Text style={theme.textPrimary}>{item.yachtName}</Text>
              <Text style={theme.textSecondary}>{item.userName}</Text>
              <Text style={theme.textMuted}>
                {dayjs(item.start?.toDate?.()).format("DD MMM YYYY")} –{" "}
                {dayjs(item.end?.toDate?.()).format("DD MMM YYYY")}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={theme.textMuted}>
              {searchText
                ? "Brak rezerwacji spełniających kryteria"
                : "Brak rezerwacji"}
            </Text>
          ) : null
        }
      />
    </View>
  );
}