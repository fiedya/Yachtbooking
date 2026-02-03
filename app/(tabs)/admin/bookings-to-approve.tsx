import { Booking } from "@/src/entities/booking";
import { subscribeToPendingBookings } from "@/src/services/booking.service";
import { styles as theme } from "@/src/theme/styles";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

type BookingRow = {
  id: string;
  yachtName: string;
  userName: string;
  start: any;
  end: any;
  status: string;
};

export default function BookingsToApproveScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    const unsub = subscribeToPendingBookings(
      (bookings) => {
        setBookings(bookings);
        setLoading(false);
      },
      (error) => {
        console.error(
          "[BOOKINGS TO APPROVE] snapshot error:",
          error,
        );
        setLoading(false);
      },
    );

    return unsub;
  }, []);


  return (
    <View style={theme.screen}>
      <FlatList
        contentContainerStyle={theme.listPadding}
        data={bookings}
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
            <Text style={theme.textMuted}>No bookings to approve</Text>
          ) : null
        }
      />
    </View>
  );
}
