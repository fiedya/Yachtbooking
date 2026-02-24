/* -----------------------------
   Date helpers
-------------------------------- */
import Icon from "@/src/components/Icon";
import { BookingStatus } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { User } from "@/src/entities/user";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMode } from "@/src/providers/ModeProvider";
import { subscribeToWeekBookings, updateBookingStatus } from "@/src/services/booking.service";
import { createNote, subscribeToNotesForBooking } from "@/src/services/noteService";
import { getUserPhotoUrl, probeUserPermissions, subscribeToAllUsers, subscribeToUser } from "@/src/services/userService";
import { subscribeToAvailableYachts } from "@/src/services/yachtService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { spacing } from "@/src/theme/spacing";
import { styles, styles as theme } from "@/src/theme/styles";

import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

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

function formatDate(d: Date) {
  return d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  });
}

function weekLabel(start: Date) {
  const end = addDays(start, 6);
  return `${formatDate(start)} – ${formatDate(end)}`;
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

function getOverlappingBookingsForBooking(
  booking: any,
  allBookings: any[],
  day: Date,
  isAdmin: boolean = false,
) {
  const start = booking.start.toDate();
  const end = booking.end.toDate();

  if (!sameDay(start, day)) return [];

  return allBookings.filter((b) => {
    // Show all statuses for admins, only pending/approved for users
    if (!isAdmin && b.status === BookingStatus.Rejected) return false;
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
    return (a.id || "").localeCompare(b.id || ""); // consistent ordering
  });
  return sorted.findIndex((b) => b.id === booking.id);
}

function getBookingBackgroundColor(
  booking: any,
  currentUserId: string | undefined,
) {
  const isUserBooking = booking.userId === currentUserId;
  const isApproved = booking.status === BookingStatus.Approved;
  const isRejected = booking.status === BookingStatus.Rejected;
  const isCancelled = booking.status === BookingStatus.Cancelled;

  if (isRejected || isCancelled) {
    return colors.dangerSoft;
  }

  if (isUserBooking) {
    return isApproved ? colors.secondary : colors.secondaryLight;
  } else {
    return isApproved ? colors.primary : colors.lightGrey;
  }
}

function getBookingFontColor(booking: any, currentUserId: string | undefined) {
  const isApproved = booking.status === BookingStatus.Approved;
  return isApproved ? colors.white : colors.black;
}

/* -----------------------------
   Constants
-------------------------------- */

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const NOTE_VISIBLE_COUNT = 3;
const NOTE_LINE_HEIGHT = 20;
const NOTE_VERTICAL_PADDING = 4;
const NOTE_ITEM_GAP = 6;

function formatNoteDate(value: any) {
  const date = value?.toDate?.() ?? null;

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--:--:----";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}:${month}:${year}`;
}

/* -----------------------------
   Screen
-------------------------------- */

export default function CalendarScreen() {
  // User preferences state
  const [settings, setSettings] = useState({ useYachtShortcuts: false });
  const [yachtMap, setYachtMap] = useState<{
    [id: string]: { name: string; shortcut?: string };
  }>({});
  const [pendingSlot, setPendingSlot] = useState<{
    day: string;
    hour: number;
  } | null>(null);

  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const { mode } = useMode();
  const [weekmode, setWeekmode] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [bookingNote, setBookingNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [bookingNotes, setBookingNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modalUserPhoto, setModalUserPhoto] = useState<string | null>(null);
  const { user, uid, loading: authLoading } = useAuth();
  const suppressGridPressRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (data) => {
      const prefs = data?.preferences ?? {
        usePseudonims: false,
        useYachtShortcuts: false,
      };
      setSettings({ useYachtShortcuts: prefs.useYachtShortcuts ?? false });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToAllUsers(
      (nextUsers) => {
        setUsers(nextUsers);
      },
      (error) => {
        console.error("[CALENDAR] users snapshot error", error);
      },
    );

    return unsub;
  }, []);

  useEffect(() => {
    if (!selectedBooking?.id) {
      setBookingNotes([]);
      return;
    }

    const unsub = subscribeToNotesForBooking(
      selectedBooking.id,
      (nextNotes) => {
        const sorted = [...nextNotes].sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
          const bTime = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
          return aTime - bTime;
        });
        setBookingNotes(sorted);
      },
      (error) => {
        console.error("[CALENDAR] notes snapshot error", error);
      },
    );

    return unsub;
  }, [selectedBooking?.id]);

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((person) => {
      const fullName = `${person.name ?? ""} ${person.surname ?? ""}`.trim();
      if (fullName) {
        map[person.uid] = fullName;
      }
    });
    return map;
  }, [users]);

  const getNoteAuthorName = (note: Note) => {
    return userNameMap[note.creatorId] ?? (note.creatorWasAdmin ? "Admin" : "Użytkownik");
  };

  const notesMaxHeight =
    NOTE_VISIBLE_COUNT * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
    (NOTE_VISIBLE_COUNT - 1) * NOTE_ITEM_GAP;
  const notesShouldScroll = bookingNotes.length > NOTE_VISIBLE_COUNT;

  useEffect(() => {
    if (!user) return;

    probeUserPermissions(user.uid);
  }, [user]);


  useEffect(() => {
    if (selectedBooking) {
      getUserPhotoUrl(selectedBooking.userId).then(setModalUserPhoto);
    } else {
      setModalUserPhoto(null);
    }
  }, [selectedBooking]);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  // Debug log for showWeekPicker state changes

  const [showCancelled, setShowCancelled] = useState(false);
  const [yachts, setYachts] = useState<any[]>([]);
  const [selectedYachtIds, setSelectedYachtIds] = useState<string[]>([]); // empty = all

  const canEditSelectedBooking =
    !!selectedBooking &&
    selectedBooking.status !== BookingStatus.Rejected &&
    selectedBooking.status !== BookingStatus.Cancelled &&
    (isAdmin || selectedBooking.userId === user?.uid);

  const isOwnSelectedBooking =
    !!selectedBooking && selectedBooking.userId === user?.uid;

  const canCancelSelectedBooking =
    !!selectedBooking &&
    selectedBooking.status !== BookingStatus.Rejected &&
    selectedBooking.status !== BookingStatus.Cancelled &&
    (isOwnSelectedBooking || isAdmin);

  const today = new Date();

  const baseWeekStart = useMemo(() => startOfWeek(new Date()), []);

  const weekStart = useMemo(
    () => addDays(baseWeekStart, weekOffset * 7),
    [baseWeekStart, weekOffset],
  );

  const findBookingForSlot = (day: Date, hour: number) => {
    const slotMinutes = hour * 60;
    const candidates = filteredBookings
      .filter((b) => sameDay(b.start.toDate(), day))
      .filter((b) => {
        const start = b.start.toDate();
        const end = b.end.toDate();
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        return startMinutes <= slotMinutes && endMinutes > slotMinutes;
      })
      .sort((a, b) => {
        const aStart = a.start.toDate().getTime();
        const bStart = b.start.toDate().getTime();
        if (aStart !== bStart) return aStart - bStart;
        return (a.id || "").localeCompare(b.id || "");
      });

    return candidates[0] ?? null;
  };

  useEffect(() => {
    const unsub = subscribeToAvailableYachts((data) => {
      setYachts(data);
      const map: { [id: string]: { name: string; shortcut?: string } } = {};
      data.forEach((y) => {
        map[y.id] = { name: y.name, shortcut: y.shortcut };
      });
      setYachtMap(map);
    });
    return unsub;
  }, []);
  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (!isAdmin) {
      result = result.filter((b) => b.status !== BookingStatus.Rejected);
    }

    if (!showCancelled) {
      result = result.filter((b) => b.status !== BookingStatus.Cancelled);
    }

    if (selectedYachtIds.length === 0) {
      return result;
    }
    return result.filter((b) => selectedYachtIds.includes(b.yachtId));
  }, [bookings, selectedYachtIds, isAdmin, showCancelled]);

useEffect(() => {
  const weekEnd = addDays(weekStart, 7);

  const unsub = subscribeToWeekBookings(
    weekStart,
    weekEnd,
    (bookings) => {
      setBookings(bookings);
    },
    (error) => {
      console.error("[CALENDAR] error", error);
    },
  );

  return unsub;
}, [weekStart]);


  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const slideAnim = useState(new Animated.Value(0))[0];
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 20,
    onPanResponderMove: Animated.event([null, { dx: slideAnim }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        // Swipe left: next week
        Animated.timing(slideAnim, {
          toValue: -400,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setWeekOffset((o) => o + 1);
          slideAnim.setValue(0);
        });
      } else if (gestureState.dx > 50) {
        // Swipe right: previous week
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setWeekOffset((o) => o - 1);
          slideAnim.setValue(0);
        });
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <View style={theme.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Kalendarz",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerRight: () => (
            <View
              style={{
                margin: 10,
                paddingRight: "5%",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: colors.black,
                  fontWeight: "600",
                }}
              >
                Anulowane
              </Text>
              <Switch
                value={showCancelled}
                onValueChange={setShowCancelled}
                trackColor={{ false: colors.lightGrey, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ),
        }}
      />

      {/* Yacht filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          theme.cardPadding,
          theme.gridBorderBottom,
          {
            backgroundColor: colors.white,
            paddingVertical: 8,
            minHeight: 40,
            maxHeight: 80,
          },
        ]}
        contentContainerStyle={{ alignItems: "center", minHeight: "50%" }}
      >
        <Pressable
          style={[
            theme.pill,
            {
              marginRight: 8,
              backgroundColor:
                selectedYachtIds.length === 0
                  ? colors.primary
                  : colors.lightGrey,
              paddingVertical: 4,
              height: "125%",
            },
          ]}
          onPress={() => setSelectedYachtIds([])}
        >
          <Text style={{ color: colors.white }}>Wszystkie</Text>
        </Pressable>

        {yachts.map((yacht) => {
          const isSelected = selectedYachtIds.includes(yacht.id);
          return (
            <Pressable
              key={yacht.id}
              style={[
                theme.pill,
                {
                  marginRight: 8,
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.lightGrey,
                  height: "125%",
                },
              ]}
              onPress={() => {
                setSelectedYachtIds((prev) =>
                  isSelected
                    ? prev.filter((id) => id !== yacht.id)
                    : [...prev, yacht.id],
                );
              }}
            >
              <Text style={{ color: colors.white }} numberOfLines={1}>
                {settings.useYachtShortcuts && yacht.shortcut
                  ? yacht.shortcut
                  : yacht.name || "Unnamed"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Week jump */}
      {weekmode === "week" && (
        <View
          style={[
            theme.row,
            theme.gridBorderBottom,
            { padding: spacing.xs, alignItems: "center" },
          ]}
        >
          {/* Previous week */}
          <Pressable
            onPress={() => setWeekOffset((o) => o - 1)}
            style={theme.iconButton}
          >
            <Icon name="chevron-back-outline" size={24} color={colors.black} />
          </Pressable>

          {/* Current week label */}
          <Pressable
            onPress={() => setShowWeekPicker(true)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text style={theme.textPrimary}>{weekLabel(weekStart)}</Text>
          </Pressable>

          {/* Next week */}
          <Pressable
            onPress={() => setWeekOffset((o) => o + 1)}
            style={theme.iconButton}
          >
            <Icon name="chevron-forward-outline" size={24} color={colors.black} />
          </Pressable>
        </View>
      )}

      {/* Calendar */}
      {weekmode === "week" ? (
        <Animated.View
          style={{ paddingBottom: 137, transform: [{ translateX: slideAnim }] }}
          {...panResponder.panHandlers}
        >
          <View style={theme.gridRow}>
            <View
              style={[
                theme.gridCellCenter,
                theme.gridBorderRight,
                { width: 40 },
              ]}
            />
            {days.map((day) => {
              const isToday = sameDay(day, today);
              return (
                <View
                  key={day.toISOString()}
                  style={[
                    theme.gridCellCenter,
                    theme.gridBorderRight,
                    { flex: 1, paddingVertical: 6 },
                    isToday && theme.highlightBackground,
                  ]}
                >
                  <Text
                    style={isToday ? theme.highlightText : theme.textSecondary}
                  >
                    {day.toLocaleDateString("pl-PL", {
                      weekday: "short",
                    })}
                  </Text>
                  <Text
                    style={isToday ? theme.highlightText : theme.textSecondary}
                  >
                    {formatDate(day)}
                  </Text>
                </View>
              );
            })}
          </View>

          <ScrollView>
            {/* Time grid */}
            {HOURS.map((h) => (
              <View key={h} style={styles.row}>
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

                {days.map((day) => {
                  const isToday = sameDay(day, today);
                  return (
                    <View
                      key={day.toISOString() + h}
                      pointerEvents="box-none"
                      style={[
                        theme.gridBorderRight,
                        theme.gridBorderBottom,
                        { flex: 1, height: 36 },
                        isToday && {
                          backgroundColor: "rgba(0, 80, 200, 0.08)", // 👈 translucent
                        },
                      ]}
                    >

                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => {
                          if (suppressGridPressRef.current) {
                            suppressGridPressRef.current = false;
                            return;
                          }
                          const dayOnly = new Date(day);
                          dayOnly.setHours(0, 0, 0, 0);
                          const todayOnly = new Date(today);
                          todayOnly.setHours(0, 0, 0, 0);
                          if (!isAdmin && dayOnly < todayOnly) {
                            Alert.alert("Błąd", "Nie można tworzyć rezerwacji w przeszłości");
                            return;
                          }
                          const bookingAtSlot = findBookingForSlot(day, h);
                          if (bookingAtSlot) {
                            setSelectedBooking(bookingAtSlot);
                            return;
                          }
                          setPendingSlot({ day: day.toISOString(), hour: h });
                          setTimeout(() => {
                            const startDate = new Date(day);
                            startDate.setHours(h, 0, 0, 0);
                            const endDate = new Date(startDate);
                            endDate.setHours(h + 1, 0, 0, 0);
                            router.push({
                              pathname: "/book",
                              params: {
                                startDate: startDate.toISOString(),
                                endDate: endDate.toISOString(),
                              },
                            });
                            setPendingSlot(null);
                          }, 200); // Show rectangle for 200ms
                        }}
                      >
                        {/* Rectangle overlay if this slot is pending */}
                        {pendingSlot &&
                          pendingSlot.day === day.toISOString() &&
                          pendingSlot.hour === h && (
                            <View
                              style={{
                                position: "absolute",
                                top: 1,
                                left: 1,
                                right: 1,
                                bottom: 1,
                                borderWidth: 1,
                                borderColor: colors.primary,
                                borderRadius: 6,
                                backgroundColor: "rgba(0,0,0,0)",
                                zIndex: 10,
                              }}
                            />
                          )}
                      </Pressable>
                      {h === 0 &&
                        filteredBookings.map((b) => {
                          const layout = getBookingStyle(b, day);
                          if (!layout) return null;

                          const overlaps = getOverlappingBookingsForBooking(
                            b,
                            filteredBookings,
                            day,
                            isAdmin,
                          );
                          const position = getBookingPosition(b, overlaps);
                          const totalOverlaps = overlaps.length;
                          const width = 100 / totalOverlaps;
                          const left = position * width;
                          const backgroundColor = getBookingBackgroundColor(
                            b,
                            user?.uid,
                          );

                          const fontColor = getBookingFontColor(b, user?.uid);

                          // Show shortcut if enabled and available
                          const yachtInfo = yachtMap[b.yachtId] || {
                            name: b.yachtName,
                          };
                          const displayYacht =
                            settings.useYachtShortcuts && yachtInfo.shortcut
                              ? yachtInfo.shortcut
                              : yachtInfo.name;
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

                                  // 👇 keep bookings above "today" highlight
                                  zIndex: 10,
                                  elevation: 5, // Android
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
                                // stop click from reaching grid cell (web)
                                e?.stopPropagation?.();
                                setSelectedBooking(b);
                              }}

                            >

                              <Text
                                style={[
                                  theme.textXs,
                                  { fontWeight: "600", color: fontColor },
                                ]}
                              >
                                {displayYacht}
                              </Text>
                              <Text
                                style={[theme.textXs, { color: fontColor }]}
                              >
                                {b.userName}
                              </Text>
                            </Pressable>
                          );
                        })}
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      ) : (
        <View style={[theme.screen, theme.center]}>
          <Text style={theme.textMuted}>Widok miesięczny – do zrobienia</Text>
        </View>
      )}

      {selectedBooking && (
        <Pressable
          style={theme.modalOverlay}
          onPress={() => {
            setSelectedBooking(null);
            setShowNoteEditor(false);
          }}
        >
          <Pressable style={theme.modal} onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={theme.title}>{selectedBooking.yachtName}</Text>
              {canEditSelectedBooking && (
                <Pressable
                  onPress={() => {
                    setSelectedBooking(null);
                    router.push({
                      pathname: "/(tabs)/book",
                      params: {
                        bookingId: selectedBooking.id,
                        edit: "1",
                      },
                    });
                  }}
                  style={{ marginLeft: 8 }}
                  accessibilityLabel="Edytuj rezerwację"
                >
                  <Icon name="pencil" size={24} color={colors.primary} />
                </Pressable>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              {modalUserPhoto ? (
                <Image
                  source={{ uri: modalUserPhoto }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 10,
                  }}
                />
              ) : (
                <Image
                  source={require("@/assets/images/user_placeholder.png")}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 10,
                  }}
                />
              )}
              <Text style={theme.textPrimary}> {selectedBooking.userName}</Text>
            </View>
            <Text
              style={[
                theme.textPrimary,
                {
                  marginBottom: 8,
                },
              ]}
            >
              ⏰{" "}
              {selectedBooking.start
                .toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {selectedBooking.end
                .toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text
              style={[
                theme.textPrimary,
                {
                  marginBottom: 8,
                },
              ]}
            >
              {"Status: "}
              {getBookingStatusLabel(selectedBooking.status)}
            </Text>

            {bookingNotes.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={[theme.textPrimary, { marginBottom: 8 }]}>Notatki</Text>
                <ScrollView
                  nestedScrollEnabled
                  style={notesShouldScroll ? { maxHeight: notesMaxHeight } : undefined}
                  contentContainerStyle={{ paddingRight: 2 }}
                >
                  {bookingNotes.map((note, index) => (
                    <Text
                      key={note.id}
                      style={[
                        theme.textSecondary,
                        {
                          lineHeight: NOTE_LINE_HEIGHT,
                          paddingVertical: NOTE_VERTICAL_PADDING,
                          marginBottom: index === bookingNotes.length - 1 ? 0 : NOTE_ITEM_GAP,
                        },
                      ]}
                    >
                      {`${formatNoteDate(note.createdAt)}, ${getNoteAuthorName(note)}: ${note.content}`}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {(isOwnSelectedBooking || isAdmin) && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <Pressable
                  style={{
                    backgroundColor: colors.lightGrey,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 6,
                  }}
                  onPress={() => {
                    setBookingNote("");
                    setShowNoteEditor(true);
                  }}
                >
                  <Text style={theme.textPrimary}>Zgłoś</Text>
                </Pressable>

                {canCancelSelectedBooking && (
                  <Pressable
                    style={{
                      backgroundColor: colors.danger,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 6,
                    }}
                    onPress={async () => {
                      await updateBookingStatus(
                        selectedBooking.id,
                        BookingStatus.Cancelled,
                      );
                      setSelectedBooking(null);
                      setShowNoteEditor(false);
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "600" }}>
                      Odwołaj
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Admin Approve/Reject Buttons */}
            {isAdmin && selectedBooking && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <Pressable
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 6,
                    marginRight: 8,
                    minWidth: 90,
                    alignItems: "center",
                  }}
                  onPress={async () => {
                    updateBookingStatus(
                      selectedBooking.id,
                      BookingStatus.Approved,
                    );
                    setSelectedBooking(null);
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "bold" }}>
                    Akceptuj
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    backgroundColor: colors.danger,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 6,
                    minWidth: 90,
                    alignItems: "center",
                  }}
                  onPress={async () => {
                    updateBookingStatus(
                      selectedBooking.id,
                      BookingStatus.Rejected,
                    );
                    setSelectedBooking(null);
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "bold" }}>
                    Odrzuc
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={{ marginTop: 16, alignSelf: "flex-end" }}
              onPress={() => {
                setSelectedBooking(null);
                setShowNoteEditor(false);
              }}
            >
              <Text style={theme.link}>Zamknij</Text>
            </Pressable>
          </Pressable>

          {showNoteEditor && (
            <Pressable
              style={theme.modalOverlay}
              onPress={() => setShowNoteEditor(false)}
            >
              <Pressable style={theme.modal} onPress={(e) => e.stopPropagation()}>
                <Text style={theme.title}>Zgłoś uwagę</Text>
                <TextInput
                  value={bookingNote}
                  onChangeText={setBookingNote}
                  style={[theme.input, theme.inputDefaultText, { minHeight: 90 }]}
                  placeholder="Wpisz notatkę"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  <Pressable onPress={() => setShowNoteEditor(false)}>
                    <Text style={theme.link}>Anuluj</Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (!selectedBooking?.id) return;
                      if (!user?.uid) return;
                      const trimmed = bookingNote.trim();
                      if (!trimmed) {
                        Alert.alert("Błąd", "Notatka nie może być pusta");
                        return;
                      }
                      setSavingNote(true);
                      try {
                        await createNote({
                          bookingId: selectedBooking.id,
                          content: trimmed,
                          creatorId: user.uid,
                          creatorWasAdmin: isAdmin,
                        });
                        setShowNoteEditor(false);
                      } catch (error) {
                        console.error("[CALENDAR] note update error", error);
                        Alert.alert("Błąd", "Nie udało się zapisać notatki");
                      } finally {
                        setSavingNote(false);
                      }
                    }}
                    disabled={savingNote}
                  >
                    <Text style={[theme.link, savingNote && { opacity: 0.6 }]}>
                      {savingNote ? "Zapisywanie..." : "Zapisz"}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          )}

          {showWeekPicker && (
            <View style={theme.modalOverlay}>
              <View style={theme.modal}>
                <Text style={theme.title}>Wybierz tydzień</Text>

                <ScrollView style={{ maxHeight: 300 }}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const offset = i - 2; // few past, few future
                    const start = addDays(baseWeekStart, offset * 7);

                    return (
                      <Pressable
                        key={offset}
                        style={[
                          theme.listItem,
                          offset === weekOffset && theme.listItemActive,
                        ]}
                        onPress={() => {
                          setWeekOffset(offset);
                          setShowWeekPicker(false);
                        }}
                      >
                        <Text
                          style={
                            offset === weekOffset
                              ? theme.textOnPrimary
                              : theme.textPrimary
                          }
                        >
                          {weekLabel(start)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  onPress={() => setShowWeekPicker(false)}
                  style={{ marginTop: 16, alignSelf: "flex-end" }}
                >
                  <Text style={theme.link}>Zamknij</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}
