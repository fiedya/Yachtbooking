import { BookingStatus } from "@/src/entities/booking";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMode } from "@/src/providers/ModeProvider";
import { subscribeToWeekBookings } from "@/src/services/booking.service";
import { getUserPhotoUrl, subscribeToUser } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Switch, Text, View } from "react-native";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_ROW_HEIGHT = 36;

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function getBookingStyle(booking: any, day: Date) {
  const start = booking.start.toDate();
  const end = booking.end.toDate();

  if (!sameDay(start, day)) return null;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  return {
    top: (startMinutes / 60) * HOUR_ROW_HEIGHT,
    height: ((endMinutes - startMinutes) / 60) * HOUR_ROW_HEIGHT,
  };
}

function getOverlappingBookingsForBooking(booking: any, allBookings: any[], day: Date) {
  const start = booking.start.toDate();
  const end = booking.end.toDate();

  if (!sameDay(start, day)) return [];

  return allBookings.filter((b) => {
    const bStart = b.start.toDate();
    const bEnd = b.end.toDate();
    return bStart < end && bEnd > start;
  });
}

function getBookingPosition(booking: any, overlappingBookings: any[]) {
  const sorted = overlappingBookings.sort((a, b) => {
    const aStart = a.start.toDate().getTime();
    const bStart = b.start.toDate().getTime();
    if (aStart !== bStart) return aStart - bStart;
    return (a.id || "").localeCompare(b.id || "");
  });

  return sorted.findIndex((b) => b.id === booking.id);
}

function getBookingBackgroundColor(booking: any, currentUserId: string | undefined) {
  const isUserBooking = booking.userId === currentUserId;
  const isApproved = booking.status === BookingStatus.Approved;
  const isRejected = booking.status === BookingStatus.Rejected;
  const isCancelled = booking.status === BookingStatus.Cancelled;

  if (isRejected || isCancelled) {
    return colors.dangerSoft;
  }

  if (isUserBooking) {
    return isApproved ? colors.secondary : colors.secondaryLight;
  }

  return isApproved ? colors.primary : colors.lightGrey;
}

function getBookingFontColor(booking: any) {
  const isApproved = booking.status === BookingStatus.Approved;
  return isApproved ? colors.white : colors.black;
}

export default function CalendarDayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { mode } = useMode();
  const { day: dayParam, showCancelled: showCancelledParam, selectedYachts: selectedYachtsParam } =
    useLocalSearchParams<{
      day?: string;
      showCancelled?: string;
      selectedYachts?: string;
    }>();

  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalUserPhoto, setModalUserPhoto] = useState<string | null>(null);
  const [showCancelledBookings, setShowCancelledBookings] = useState(showCancelledParam === "1");
  const suppressGridPressRef = useRef(false);

  const selectedDay = useMemo(() => {
    if (!dayParam) return new Date();
    const parsed = new Date(dayParam);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dayParam]);

  const selectedYachtIds = useMemo(
    () => (selectedYachtsParam ? selectedYachtsParam.split(",").filter(Boolean) : []),
    [selectedYachtsParam],
  );

  useEffect(() => {
    setShowCancelledBookings(showCancelledParam === "1");
  }, [showCancelledParam]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode, user]);

  useEffect(() => {
    const dayStart = new Date(selectedDay);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const unsub = subscribeToWeekBookings(
      dayStart,
      dayEnd,
      (nextBookings) => setBookings(nextBookings),
      (error) => console.error("[CALENDAR DAY] error", error),
    );

    return unsub;
  }, [selectedDay]);

  useEffect(() => {
    if (selectedBooking) {
      getUserPhotoUrl(selectedBooking.userId).then(setModalUserPhoto);
    } else {
      setModalUserPhoto(null);
    }
  }, [selectedBooking]);

  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (!showCancelledBookings) {
      result = result.filter(
        (b) => b.status !== BookingStatus.Rejected && b.status !== BookingStatus.Cancelled,
      );
    } else if (!isAdmin) {
      result = result.filter((b) => b.status !== BookingStatus.Rejected);
    }

    if (selectedYachtIds.length === 0) {
      return result;
    }

    return result.filter((b) => selectedYachtIds.includes(b.yachtId));
  }, [bookings, showCancelledBookings, isAdmin, selectedYachtIds]);

  return (
    <View style={theme.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Dzień",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
              <Text style={[theme.textSecondary, { marginRight: 6 }]}>Anulowane</Text>
              <Switch
                value={showCancelledBookings}
                onValueChange={setShowCancelledBookings}
                trackColor={{ false: colors.lightGrey, true: colors.primary }}
                thumbColor={showCancelledBookings ? colors.primary : colors.white}
              />
            </View>
          ),
        }}
      />

      <View style={theme.gridRow}>
        <View style={[theme.gridCellCenter, theme.gridBorderRight, { width: 52 }]} />
        <View style={[theme.gridCellCenter, theme.gridBorderRight, { flex: 1, paddingVertical: 6 }]}>
          <Text style={theme.textPrimary}>{formatDate(selectedDay)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator nestedScrollEnabled>
        {HOURS.map((h) => (
          <View key={h} style={theme.gridRow}>
            <View style={[theme.gridCellTopCenter, theme.gridBorderRight, { width: 52 }]}>
              <Text style={theme.textXs}>{String(h).padStart(2, "0")}:00</Text>
            </View>

            <View
              pointerEvents="box-none"
              style={[theme.gridBorderRight, theme.gridBorderBottom, { flex: 1, height: HOUR_ROW_HEIGHT }]}
            >
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  if (suppressGridPressRef.current) {
                    suppressGridPressRef.current = false;
                    return;
                  }

                  const startDate = new Date(selectedDay);
                  startDate.setHours(h, 0, 0, 0);
                  const endDate = new Date(startDate);
                  endDate.setHours(h + 1, 0, 0, 0);

                  const todayOnly = new Date();
                  todayOnly.setHours(0, 0, 0, 0);
                  const dayOnly = new Date(selectedDay);
                  dayOnly.setHours(0, 0, 0, 0);
                  if (!isAdmin && dayOnly < todayOnly) {
                    Alert.alert("Błąd", "Nie można tworzyć rezerwacji w przeszłości");
                    return;
                  }

                  router.push({
                    pathname: "/book",
                    params: {
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                    },
                  });
                }}
              />

              {h === 0 &&
                filteredBookings.map((b) => {
                  const layout = getBookingStyle(b, selectedDay);
                  if (!layout) return null;

                  const overlaps = getOverlappingBookingsForBooking(b, filteredBookings, selectedDay);
                  const position = getBookingPosition(b, overlaps);
                  const totalOverlaps = overlaps.length;
                  const width = 100 / totalOverlaps;
                  const left = position * width;
                  const backgroundColor = getBookingBackgroundColor(b, user?.uid);
                  const fontColor = getBookingFontColor(b);

                  return (
                    <Pressable
                      key={b.id}
                      style={[
                        theme.absoluteCard,
                        {
                          backgroundColor,
                          left: `${left}%`,
                          width: `${width}%`,
                          overflow: "hidden",
                          zIndex: 10,
                          elevation: 5,
                        },
                        layout,
                      ]}
                      onPressIn={() => {
                        suppressGridPressRef.current = true;
                      }}
                      onPressOut={() => {
                        setTimeout(() => {
                          suppressGridPressRef.current = false;
                        }, 0);
                      }}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        setSelectedBooking(b);
                      }}
                    >
                      <Text style={[theme.textXs, { fontWeight: "600", color: fontColor }]}>
                        {b.yachtName}
                      </Text>
                      <Text style={[theme.textXs, { color: fontColor }]}>{b.userName}</Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        ))}
      </ScrollView>

      {selectedBooking && (
        <Pressable style={theme.modalOverlay} onPress={() => setSelectedBooking(null)}>
          <Pressable style={theme.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={theme.title}>{selectedBooking.yachtName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              {modalUserPhoto ? (
                <Image
                  source={{ uri: modalUserPhoto }}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                />
              ) : (
                <Image
                  source={require("@/assets/images/user_placeholder.png")}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                />
              )}
              <Text style={theme.textPrimary}> {selectedBooking.userName}</Text>
            </View>
            <Text style={[theme.textPrimary, { marginBottom: 8 }]}>⏰ {selectedBooking.start.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {selectedBooking.end.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            <Text style={[theme.textPrimary, { marginBottom: 8 }]}>Status: {getBookingStatusLabel(selectedBooking.status)}</Text>

            <Pressable style={{ marginTop: 16, alignSelf: "flex-end" }} onPress={() => setSelectedBooking(null)}>
              <Text style={theme.link}>Zamknij</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}
