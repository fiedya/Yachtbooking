import Icon from "@/src/components/Icon";
import { BookingStatus } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMode } from "@/src/providers/ModeProvider";
import { useTheme } from "@/src/providers/ThemeContext";
import { subscribeToWeekBookings, updateBookingStatus } from "@/src/services/booking.service";
import { createNote, subscribeToNotesForBooking } from "@/src/services/noteService";
import { getUserPhotoUrl } from "@/src/services/userService";
import { createHeaderStyles } from "@/src/theme/header";
import { createStyles } from "@/src/theme/styles";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_ROW_HEIGHT = 36;
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

function getDayBookingLayout(day: Date, allBookings: any[]) {
  const dayBookings = allBookings
    .filter((booking) => sameDay(booking.start.toDate(), day))
    .sort((a, b) => {
      const aStart = a.start.toDate().getTime();
      const bStart = b.start.toDate().getTime();
      if (aStart !== bStart) return aStart - bStart;

      const aEnd = a.end.toDate().getTime();
      const bEnd = b.end.toDate().getTime();
      if (aEnd !== bEnd) return aEnd - bEnd;

      return (a.id || "").localeCompare(b.id || "");
    });

  const layoutById: Record<string, { left: number; width: number }> = {};

  let group: any[] = [];
  let groupEnd = 0;

  const flushGroup = () => {
    if (group.length === 0) return;

    const sortedGroup = [...group].sort((a, b) => {
      const aStart = a.start.toDate().getTime();
      const bStart = b.start.toDate().getTime();
      if (aStart !== bStart) return aStart - bStart;

      const aEnd = a.end.toDate().getTime();
      const bEnd = b.end.toDate().getTime();
      if (aEnd !== bEnd) return aEnd - bEnd;

      return (a.id || "").localeCompare(b.id || "");
    });

    const columnEndTimes: number[] = [];
    const columnByBookingId: Record<string, number> = {};

    sortedGroup.forEach((booking) => {
      const start = booking.start.toDate().getTime();
      const end = booking.end.toDate().getTime();

      let columnIndex = columnEndTimes.findIndex((columnEnd) => columnEnd <= start);
      if (columnIndex === -1) {
        columnIndex = columnEndTimes.length;
        columnEndTimes.push(end);
      } else {
        columnEndTimes[columnIndex] = end;
      }

      columnByBookingId[booking.id] = columnIndex;
    });

    const columnCount = Math.max(1, columnEndTimes.length);
    const columnWidth = 100 / columnCount;

    sortedGroup.forEach((booking) => {
      const columnIndex = columnByBookingId[booking.id] ?? 0;
      layoutById[booking.id] = {
        left: columnIndex * columnWidth,
        width: columnWidth,
      };
    });

    group = [];
    groupEnd = 0;
  };

  dayBookings.forEach((booking) => {
    const start = booking.start.toDate().getTime();
    const end = booking.end.toDate().getTime();

    if (group.length === 0) {
      group = [booking];
      groupEnd = end;
      return;
    }

    if (start < groupEnd) {
      group.push(booking);
      groupEnd = Math.max(groupEnd, end);
      return;
    }

    flushGroup();
    group = [booking];
    groupEnd = end;
  });

  flushGroup();

  return layoutById;
}

function getBookingBackgroundColor(
  booking: any,
  currentUserId: string | undefined,
  colors: ReturnType<typeof useTheme>["colors"],
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
  }

  return isApproved ? colors.primary : colors.lightGrey;
}

function getBookingFontColor(
  booking: any,
  colors: ReturnType<typeof useTheme>["colors"],
) {
  const isApproved = booking.status === BookingStatus.Approved;
  return isApproved ? colors.white : colors.black;
}

function getBookingYachtIds(booking: any): string[] {
  if (Array.isArray(booking?.yachtIds)) {
    return booking.yachtIds.filter(Boolean);
  }

  if (booking?.yachtId) {
    return [booking.yachtId];
  }

  return [];
}

function getBookingYachtNames(booking: any): string[] {
  if (Array.isArray(booking?.yachtNames)) {
    return booking.yachtNames.filter(Boolean);
  }

  if (booking?.yachtName) {
    return [booking.yachtName];
  }

  return [];
}

function getBookingYachtLabel(booking: any) {
  const names = getBookingYachtNames(booking);
  if (names.length > 0) {
    return names.join(", ");
  }

  return "Unnamed";
}

export default function CalendarDayScreen() {
  const { colors } = useTheme();
  const theme = createStyles(colors);
  const headerStyles = createHeaderStyles(colors);
  const router = useRouter();
  const { user } = useAuth();
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const { day: dayParam, showCancelled: showCancelledParam, selectedYachts: selectedYachtsParam } =
    useLocalSearchParams<{
      day?: string;
      showCancelled?: string;
      selectedYachts?: string;
    }>();

  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalUserPhoto, setModalUserPhoto] = useState<string | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [bookingNote, setBookingNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [bookingNotes, setBookingNotes] = useState<Note[]>([]);
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
        console.error("[CALENDAR DAY] notes snapshot error", error);
      },
    );

    return unsub;
  }, [selectedBooking?.id]);

  useEffect(() => {
    if (selectedBooking) {
      getUserPhotoUrl(selectedBooking.userId).then(setModalUserPhoto);
    } else {
      setModalUserPhoto(null);
    }
  }, [selectedBooking]);

  const notesMaxHeight =
    NOTE_VISIBLE_COUNT * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
    (NOTE_VISIBLE_COUNT - 1) * NOTE_ITEM_GAP;
  const notesContentHeight = Math.max(
    0,
    bookingNotes.length * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
      Math.max(0, bookingNotes.length - 1) * NOTE_ITEM_GAP,
  );
  const notesContainerHeight = Math.min(notesMaxHeight, notesContentHeight);

  const canEditSelectedBooking =
    !!selectedBooking &&
    selectedBooking.status !== BookingStatus.Rejected &&
    (isAdmin || selectedBooking.userId === user?.uid);

  const isOwnSelectedBooking =
    !!selectedBooking && selectedBooking.userId === user?.uid;

  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (!showCancelledBookings) {
      result = result.filter(
        (b) => b.status !== BookingStatus.Rejected && b.status !== BookingStatus.Cancelled,
      );
    } else if (!isAdmin) {
      result = result.filter(
        (b) =>
          b.status !== BookingStatus.Rejected &&
          (b.status !== BookingStatus.Cancelled || b.userId === user?.uid),
      );
    }

    if (selectedYachtIds.length === 0) {
      return result;
    }

    return result.filter((b) => {
      const bookingYachtIds = getBookingYachtIds(b);
      return bookingYachtIds.some((id) => selectedYachtIds.includes(id));
    });
  }, [bookings, showCancelledBookings, isAdmin, selectedYachtIds, user?.uid]);

  const dayBookingLayout = useMemo(
    () => getDayBookingLayout(selectedDay, filteredBookings),
    [selectedDay, filteredBookings],
  );

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
              <Text style={[theme.textSecondary, { marginRight: 6 }]}>Odwołane</Text>
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

                  const columnLayout = dayBookingLayout[b.id];
                  if (!columnLayout) return null;

                  const backgroundColor = getBookingBackgroundColor(
                    b,
                    user?.uid,
                    colors,
                  );
                  const fontColor = getBookingFontColor(b, colors);

                  return (
                    <Pressable
                      key={b.id}
                      style={[
                        theme.absoluteCard,
                        {
                          backgroundColor,
                          left: `${columnLayout.left}%`,
                          width: `${columnLayout.width}%`,
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
                        {getBookingYachtLabel(b)}
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
              <Text style={theme.title}>{getBookingYachtLabel(selectedBooking)}</Text>
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

            {bookingNotes.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={[theme.textPrimary, { marginBottom: 8 }]}>Notatki</Text>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  scrollEnabled={bookingNotes.length > NOTE_VISIBLE_COUNT}
                  style={{ height: notesContainerHeight }}
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
                      {`${formatNoteDate(note.createdAt)}: ${note.content}`}
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
                  gap: 8,
                  marginBottom: 8,
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

                {selectedBooking.status !== BookingStatus.Rejected &&
                  selectedBooking.status !== BookingStatus.Cancelled && (
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
                    <Text style={{ color: colors.white, fontWeight: "bold" }}>
                      Odwołaj
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

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
                        console.error("[CALENDAR DAY] note update error", error);
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
        </Pressable>
      )}
    </View>
  );
}
