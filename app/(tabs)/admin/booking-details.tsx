import { BookingStatus } from "@/src/entities/booking";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToBooking, updateBookingStatus } from "@/src/services/booking.service";
import { styles as theme } from "@/src/theme/styles";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

/* Date helpers */
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type BookingDetails = {
  id: string;
  yachtName: string;
  userName: string;
  start: any;
  end: any;
  status: BookingStatus;
};

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const unsub = subscribeToBooking(bookingId, (booking) => {
      if (!booking) return;
      setBooking(booking);
    });

    return unsub;
  }, [bookingId]);


  if (!booking) {
    return (
      <View style={[theme.screenPadded, theme.center]}>
        <Text style={theme.textMuted}>Loading booking…</Text>
      </View>
    );
  }
  
  async function updateStatus(
    nextStatus: BookingStatus.Approved | BookingStatus.Rejected,
  ) {
    const actionLabel =
      nextStatus === BookingStatus.Approved ? "zaakceptować" : "odrzucić";
    const message = `Na pewno chcesz ${actionLabel} ten booking?`;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(message);
      if (!confirmed || !booking) return;
      setUpdating(true);
      try {
        await updateBookingStatus(booking.id, nextStatus);
        router.back();
      } finally {
        setUpdating(false);
      }
      return;
    }

    Alert.alert("Potwierdź", message, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Potwierdź",
        style: "destructive",
        onPress: async () => {
          if (!booking) return;

          setUpdating(true);
          try {
            await updateBookingStatus(booking.id, nextStatus);
            router.back();
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  }


  const startDate = booking.start?.toDate?.();
  const endDate = booking.end?.toDate?.();
  const isApproved = booking.status === BookingStatus.Approved;
  const isRejected = booking.status === BookingStatus.Rejected;

  const startHour = Math.max(0, (startDate?.getHours?.() ?? 0) - 2);
  const endHour = Math.min(
    24,
    Math.ceil(
      (endDate?.getHours?.() ?? 0) +
        (endDate?.getMinutes?.() ?? 0) / 60 +
        2,
    ),
  );

  return (
    <ScrollView style={theme.screenPadded} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={theme.title}>{booking.yachtName}</Text>
      <Text style={theme.textSecondary}>{booking.userName}</Text>

      <View style={{ marginVertical: 24 }}>
        <Text style={theme.textMuted}>Daty rezerwacji</Text>
        <Text style={theme.textPrimary}>
          {dayjs(startDate).format("DD MMM YYYY HH:mm")} –{" "}
          {dayjs(endDate).format("DD MMM YYYY HH:mm")}
        </Text>
      </View>

      <View style={{ marginVertical: 16 }}>
        <Text style={theme.textMuted}>Current status</Text>
        <Text style={theme.textPrimary}>
          {getBookingStatusLabel(booking.status)}
        </Text>
      </View>

      {!isApproved && (
        <Pressable
          style={[theme.button, { opacity: updating ? 0.5 : 1 }]}
          onPress={() => updateStatus(BookingStatus.Approved)}
          disabled={updating}
        >
          <Text style={theme.buttonText}>
            {updating ? "Przetwarzanie..." : "Akceptuj"}
          </Text>
        </Pressable>
      )}

      {!isRejected && (
        <Pressable
          style={[
            theme.button,
            theme.buttonDanger,
            { opacity: updating ? 0.5 : 1 },
          ]}
          onPress={() => updateStatus(BookingStatus.Rejected)}
          disabled={updating}
        >
          <Text style={theme.buttonDangerText}>
            {updating ? "Przetwarzanie..." : "Odrzuć"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
