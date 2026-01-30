import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import firestore from "@react-native-firebase/firestore";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

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

function getBookingStyle(booking: any, day: Date) {
  const start = booking.start.toDate();
  const end = booking.end.toDate();

  if (!sameDay(start, day)) return null;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  return {
    top: (startMinutes / 60) * 36,
    height: ((endMinutes - startMinutes) / 60) * 36,
  };
}

const HOURS_RANGE = 8; // 4 hours before and after

type BookingDetails = {
  id: string;
  yachtName: string;
  userName: string;
  start: any;
  end: any;
  status: string;
};

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const unsub = firestore()
      .collection("bookings")
      .doc(bookingId)
      .onSnapshot((doc) => {
        if (!doc.exists) return;

        const d = doc.data()!;
        setBooking({
          id: doc.id,
          yachtName: d.yachtName,
          userName: d.userName,
          start: d.start,
          end: d.end,
          status: d.status,
        });
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

  function updateStatus(nextStatus: "approved" | "rejected") {
    const actionLabel = nextStatus === "approved" ? "zaakceptować" : "odrzucić";
    Alert.alert("Potwierdź", `Na pewno chcesz ${actionLabel} ten booking?`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Potwierdź",
        style: "destructive",
        onPress: async () => {
          setUpdating(true);
          try {
            await firestore()
              .collection("bookings")
              .doc(booking?.id)
              .update({ status: nextStatus });

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
  const isApproved = booking.status === "approved";
  const isRejected = booking.status === "rejected"//UserStatus.Rejected;

  // Calculate time range: 2 hours before start, 2 hours after end
  const startHour = Math.max(0, (startDate?.getHours?.() ?? 0) - 2);
  const endHour = Math.min(
    24,
    Math.ceil(
      (endDate?.getHours?.() ?? 0) + (endDate?.getMinutes?.() ?? 0) / 60 + 2,
    ),
  );

  return (
    <ScrollView
      style={theme.screenPadded}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* Yacht and Person */}
      <Text style={theme.title}>{booking.yachtName}</Text>
      <Text style={theme.textSecondary}>{booking.userName}</Text>

      {/* Dates */}
      <View style={{ marginVertical: 24 }}>
        <Text style={theme.textMuted}>Daty rezerwacji</Text>
        <Text style={theme.textPrimary}>
          {dayjs(startDate).format("DD MMM YYYY HH:mm")} -{" "}
          {dayjs(endDate).format("DD MMM YYYY HH:mm")}
        </Text>
      </View>

      {/* Mini Calendar - Time Grid (matching main calendar style) */}
      {startDate && endDate && (
        <View
          style={{
            marginVertical: 16,
            borderRadius: 8,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ position: "relative" }}>
            <ScrollView scrollEventThrottle={16}>
              {/* Days header */}
              <View style={[theme.gridRow]}>
                <View
                  style={[
                    theme.gridCellCenter,
                    theme.gridBorderRight,
                    { width: 40 },
                  ]}
                />
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayDate = addDays(startOfWeek(startDate), dayIndex);

                  const isBookingDay = sameDay(dayDate, startDate);

                  return (
                    <View
                      key={dayIndex}
                      style={[
                        theme.gridCellCenter,
                        theme.gridBorderRight,
                        { flex: 1, paddingVertical: 6 },
                        isBookingDay && theme.highlightBackground,
                      ]}
                    >
                      <Text
                        style={
                          isBookingDay
                            ? theme.highlightText
                            : theme.textSecondary
                        }
                      >
                        {dayjs(dayDate).format("ddd")}
                      </Text>
                      <Text
                        style={
                          isBookingDay
                            ? theme.highlightText
                            : theme.textSecondary
                        }
                      >
                        {dayjs(dayDate).format("DD")}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Time grid */}
              {Array.from({ length: endHour - startHour }, (_, hourIndex) => {
                const h = startHour + hourIndex;
                return (
                  <View key={h} style={theme.gridRow}>
                    <View
                      style={[
                        theme.gridCellTopCenter,
                        theme.gridBorderRight,
                        { width: 40 },
                      ]}
                    >
                      <Text style={theme.textXs}>
                        {String(h).padStart(2, "0")}:00
                      </Text>
                    </View>

                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const dayDate = addDays(startOfWeek(startDate), dayIndex);
                      const isBookingDay = sameDay(dayDate, startDate);

                      // Check if booking cell overlaps with this hour on this day
                      const cellStart = new Date(dayDate);
                      cellStart.setHours(h, 0, 0, 0);
                      const cellEnd = new Date(cellStart);
                      cellEnd.setHours(h + 1, 0, 0, 0);

                      const bookingOverlapsCell =
                        isBookingDay &&
                        startDate < cellEnd &&
                        endDate > cellStart;

                      return (
                        <View
                          key={dayIndex}
                          pointerEvents="box-none"
                          style={[
                            theme.gridBorderRight,
                            theme.gridBorderBottom,
                            {
                              flex: 1,
                              height: 36,
                              position: "relative",
                              overflow: "hidden",
                            },
                            isBookingDay && theme.highlightBackground,
                          ]}
                        >
                          {bookingOverlapsCell && (
                            <View
                              style={{
                                position: "absolute",
                                left: 2,
                                right: 2,
                                top:
                                  h === startDate.getHours()
                                    ? (startDate.getMinutes() / 60) * 36
                                    : 0,
                                height:
                                  h === startDate.getHours() &&
                                  h === endDate.getHours()
                                    ? (endDate.getHours() -
                                        startDate.getHours() +
                                        (endDate.getMinutes() -
                                          startDate.getMinutes()) /
                                          60) *
                                      36
                                    : h === startDate.getHours()
                                      ? 36 - (startDate.getMinutes() / 60) * 36
                                      : h === endDate.getHours()
                                        ? (endDate.getMinutes() / 60) * 36
                                        : 36,
                                backgroundColor: colors.secondary,
                                borderRadius: 4,
                                opacity: 0.8,
                              }}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>

            {/* Booking Rectangle Overlay - positioned above grid */}
          </View>
        </View>
      )}

      {/* Status */}
      <View style={{ marginVertical: 16 }}>
        <Text style={theme.textMuted}>Current status</Text>
        <Text style={theme.textPrimary}>{booking.status}</Text>
      </View>

      {/* Buttons */}
      {!isApproved && (
        <Pressable
          style={[
            theme.button,
            { marginBottom: 12, opacity: updating ? 0.5 : 1 },
          ]}
          onPress={() => updateStatus("approved")}
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
          onPress={() => updateStatus("rejected")}
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
