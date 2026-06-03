/* -----------------------------
   Date helpers
-------------------------------- */
import Icon from "@/src/components/Icon";
import { BookingStatus } from "@/src/entities/booking";
import { Duty } from "@/src/entities/duty";
import { Note } from "@/src/entities/note";
import { Permission } from "@/src/entities/permissionGroup";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { useCalendarMode } from "@/src/providers/CalendarModeProvider";
import { useMode } from "@/src/providers/ModeProvider";
import { usePermissions } from "@/src/providers/PermissionsProvider";
import { subscribeToSharedWeekBookings, updateBookingStatus } from "@/src/services/booking.service";
import { softDeleteDuty, subscribeToWeekDuties } from "@/src/services/dutyService";
import { createNote, subscribeToNotesForBooking } from "@/src/services/noteService";
import { getUserPhotoUrl, subscribeToUser } from "@/src/services/userService";
import { subscribeToAvailableYachts } from "@/src/services/yachtService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { spacing } from "@/src/theme/spacing";
import { styles, styles as theme } from "@/src/theme/styles";
import { useIsFocused } from "@react-navigation/native";

import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions
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
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
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

/* Returns the absolute position/height of a duty on a given calendar day,
   clipping to the visible day boundaries. Returns null if no overlap.
   Uses timestamp arithmetic to avoid getHours()===0 bug at midnight. */
function getDutyStyleForDay(duty: Duty, day: Date) {
  const s = duty.start?.toDate?.();
  const e = duty.end?.toDate?.();
  if (!s || !e) return null;

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEndMs = dayStart.getTime() + 24 * 60 * 60 * 1000;

  if (s.getTime() >= dayEndMs || e.getTime() <= dayStart.getTime()) return null;

  const clippedStartMs = Math.max(s.getTime(), dayStart.getTime());
  const clippedEndMs = Math.min(e.getTime(), dayEndMs);

  const startMin = (clippedStartMs - dayStart.getTime()) / 60000;
  const endMin = (clippedEndMs - dayStart.getTime()) / 60000;

  return {
    top: (startMin / 60) * HOUR_ROW_HEIGHT,
    height: ((endMin - startMin) / 60) * HOUR_ROW_HEIGHT,
  };
}

/* Merge overlapping booking intervals for a given day (duties calendar view).
   Uses timestamp arithmetic to avoid getHours()===0 bug at midnight. */
// function getMergedBookingIntervals(
//   day: Date,
//   bookings: any[],
// ): Array<{ top: number; height: number }> {
//   const dayStart = new Date(day);
//   dayStart.setHours(0, 0, 0, 0);
//   const dayStartMs = dayStart.getTime();
//   const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
//
//   const intervals = bookings
//     .filter((b) => {
//       const s = b.start?.toDate?.();
//       const e = b.end?.toDate?.();
//       return s && e && s.getTime() < dayEndMs && e.getTime() > dayStartMs;
//     })
//     .map((b) => {
//       const s = b.start.toDate().getTime();
//       const e = b.end.toDate().getTime();
//       return {
//         start: (Math.max(s, dayStartMs) - dayStartMs) / 60000,
//         end: (Math.min(e, dayEndMs) - dayStartMs) / 60000,
//       };
//     })
//     .sort((a, b) => a.start - b.start);
//
//   const merged: Array<{ start: number; end: number }> = [];
//   for (const iv of intervals) {
//     if (merged.length === 0 || iv.start > merged[merged.length - 1].end) {
//       merged.push({ ...iv });
//     } else {
//       merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
//     }
//   }
//
//   return merged.map((iv) => ({
//     top: (iv.start / 60) * HOUR_ROW_HEIGHT,
//     height: ((iv.end - iv.start) / 60) * HOUR_ROW_HEIGHT,
//   }));
// }

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
      let columnIndex = columnEndTimes.findIndex((ce) => ce <= start);
      if (columnIndex === -1) { columnIndex = columnEndTimes.length; columnEndTimes.push(end); }
      else { columnEndTimes[columnIndex] = end; }
      columnByBookingId[booking.id] = columnIndex;
    });
    const columnCount = Math.max(1, columnEndTimes.length);
    const columnWidth = 100 / columnCount;
    sortedGroup.forEach((booking) => {
      const columnIndex = columnByBookingId[booking.id] ?? 0;
      layoutById[booking.id] = { left: columnIndex * columnWidth, width: columnWidth };
    });
    group = [];
    groupEnd = 0;
  };

  dayBookings.forEach((booking) => {
    const start = booking.start.toDate().getTime();
    const end = booking.end.toDate().getTime();
    if (group.length === 0) { group = [booking]; groupEnd = end; return; }
    if (start < groupEnd) { group.push(booking); groupEnd = Math.max(groupEnd, end); return; }
    flushGroup();
    group = [booking];
    groupEnd = end;
  });
  flushGroup();
  return layoutById;
}

function getBookingBackgroundColor(booking: any, currentUserId: string | undefined) {
  const isUserBooking = booking.userId === currentUserId;
  const isApproved = booking.status === BookingStatus.Approved;
  const isRejected = booking.status === BookingStatus.Rejected;
  const isCancelled = booking.status === BookingStatus.Cancelled;

  if (isRejected || isCancelled) return colors.dangerSoft;
  if (isUserBooking) return isApproved ? colors.secondary : colors.secondaryLight;
  return isApproved ? colors.primary : colors.lightGrey;
}

function getBookingFontColor(booking: any, currentUserId: string | undefined) {
  const isApproved = booking.status === BookingStatus.Approved;
  return isApproved ? colors.white : colors.black;
}

function getBookingYachtIds(booking: any): string[] {
  if (Array.isArray(booking?.yachtIds)) return booking.yachtIds.filter(Boolean);
  if (booking?.yachtId) return [booking.yachtId];
  return [];
}

function getBookingYachtNames(booking: any): string[] {
  if (Array.isArray(booking?.yachtNames)) return booking.yachtNames.filter(Boolean);
  if (booking?.yachtName) return [booking.yachtName];
  return [];
}

function getBookingYachtLabel(
  booking: any,
  yachtMap: { [id: string]: { name: string; shortcut?: string } },
  useYachtShortcuts: boolean,
) {
  const ids = getBookingYachtIds(booking);
  const names = getBookingYachtNames(booking);
  const labels = ids
    .map((id, index) => {
      const yachtInfo = yachtMap[id];
      if (useYachtShortcuts && yachtInfo?.shortcut) return yachtInfo.shortcut;
      return yachtInfo?.name ?? names[index];
    })
    .filter(Boolean);
  if (labels.length > 0) return labels.join(", ");
  if (names.length > 0) return names.join(", ");
  return "Unnamed";
}

/* -----------------------------
   Constants
-------------------------------- */

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_ROW_HEIGHT = 36;
const NOTE_VISIBLE_COUNT = 3;
const NOTE_LINE_HEIGHT = 20;
const NOTE_VERTICAL_PADDING = 4;
const NOTE_ITEM_GAP = 6;

const DUTY_BAR_WIDTH_PERCENT = 10;
const BOOKING_WIDTH_PERCENT = 90;

function formatNoteDate(value: any) {
  const date = value?.toDate?.() ?? null;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--:----";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}:${month}:${year}`;
}

/* -----------------------------
   Screen
-------------------------------- */

export default function CalendarScreen() {
  const { height: viewportHeight } = useWindowDimensions();
  const [settings, setSettings] = useState({ useYachtShortcuts: false });
  const [userPhone, setUserPhone] = useState<string>("");
  const [yachtMap, setYachtMap] = useState<{ [id: string]: { name: string; shortcut?: string } }>({});
  const [pendingSlot, setPendingSlot] = useState<{ day: string; hour: number } | null>(null);
  const [dutyFilter, setDutyFilter] = useState<"all" | "mine">("all");

  const router = useRouter();
  const isFocused = useIsFocused();
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const { calendarMode, toggleCalendarMode } = useCalendarMode();
  const isDutiesMode = calendarMode === "duties";

  const { can } = usePermissions();
  const canApproveBooking = isAdmin || can(Permission.ApproveBooking);
  const canManageDuty = isAdmin || can(Permission.ManageDuty);
  const [weekmode] = useState<"week">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [bookingNote, setBookingNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [bookingNotes, setBookingNotes] = useState<Note[]>([]);
  const [showAdminRejectInput, setShowAdminRejectInput] = useState(false);
  const [adminRejectReason, setAdminRejectReason] = useState("");
  const [modalUserPhoto, setModalUserPhoto] = useState<string | null>(null);
  const { user } = useAuth();
  const suppressGridPressRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (data) => {
      const prefs = data?.preferences ?? { usePseudonims: false, useYachtShortcuts: false };
      setSettings({ useYachtShortcuts: prefs.useYachtShortcuts ?? false });
      setUserPhone(data?.phone ?? "");
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!selectedBooking?.id) { setBookingNotes([]); return; }
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
      (error) => console.error("[CALENDAR] notes snapshot error", error),
    );
    return unsub;
  }, [selectedBooking?.id]);

  const getNoteAuthorName = (note: Note) => (note.creatorWasAdmin ? "Admin" : "Użytkownik");

  const notesMaxHeight =
    NOTE_VISIBLE_COUNT * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
    (NOTE_VISIBLE_COUNT - 1) * NOTE_ITEM_GAP;
  const notesContentHeight = Math.max(
    0,
    bookingNotes.length * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
      Math.max(0, bookingNotes.length - 1) * NOTE_ITEM_GAP,
  );
  const notesContainerHeight = Math.min(notesMaxHeight, notesContentHeight);

  useEffect(() => {
    if (selectedBooking) {
      getUserPhotoUrl(selectedBooking.userId).then(setModalUserPhoto);
    } else {
      setModalUserPhoto(null);
    }
  }, [selectedBooking]);

  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [calendarGridTopOffset, setCalendarGridTopOffset] = useState<number | null>(null);
  const calendarScrollRef = useRef<ScrollView | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [yachts, setYachts] = useState<any[]>([]);
  const [selectedYachtIds, setSelectedYachtIds] = useState<string[]>([]);
  const [showCancelledBookings, setShowCancelledBookings] = useState(false);

  const updateCalendarGridTopOffset = () => {
    if (Platform.OS !== "web") return;
    const ref = calendarScrollRef.current as any;
    if (typeof ref?.measureInWindow !== "function") return;
    ref.measureInWindow((_x: number, y: number) => {
      setCalendarGridTopOffset((prev) => {
        if (prev !== null && Math.abs(prev - y) < 1) return prev;
        return y;
      });
    });
  };

  const webCalendarScrollHeight = useMemo(() => {
    if (Platform.OS !== "web" || calendarGridTopOffset === null) return undefined;
    return Math.max(220, viewportHeight - calendarGridTopOffset - spacing.sm);
  }, [viewportHeight, calendarGridTopOffset]);

  const calendarScrollBottomPadding = useMemo(() => {
    if (Platform.OS !== "web") return spacing.xl;
    return HOUR_ROW_HEIGHT + HOUR_ROW_HEIGHT / 2;
  }, []);

  useEffect(() => { updateCalendarGridTopOffset(); }, [viewportHeight]);

  const canEditSelectedBooking =
    !!selectedBooking &&
    selectedBooking.status !== BookingStatus.Rejected &&
    (isAdmin || selectedBooking.userId === user?.uid);

  const isOwnSelectedBooking = !!selectedBooking && selectedBooking.userId === user?.uid;
  const today = new Date();
  const baseWeekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekStart = useMemo(() => addDays(baseWeekStart, weekOffset * 7), [baseWeekStart, weekOffset]);

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
    if (!user) return;
    const unsub = subscribeToAvailableYachts((data) => {
      setYachts(data);
      const map: { [id: string]: { name: string; shortcut?: string } } = {};
      data.forEach((y) => { map[y.id] = { name: y.name, shortcut: y.shortcut }; });
      setYachtMap(map);
    });
    return unsub;
  }, [user]);

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
    if (selectedYachtIds.length === 0) return result;
    return result.filter((b) => {
      const bookingYachtIds = getBookingYachtIds(b);
      return bookingYachtIds.some((id) => selectedYachtIds.includes(id));
    });
  }, [bookings, selectedYachtIds, showCancelledBookings, isAdmin, user?.uid]);

  // ─── Bookings subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!isFocused || !user) { setIsRefreshing(false); return; }
    const weekEnd = addDays(weekStart, 7);
    setIsRefreshing(true);
    const unsub = subscribeToSharedWeekBookings(
      weekStart,
      weekEnd,
      (b) => { setBookings(b); setIsRefreshing(false); },
      (error) => { console.error("[CALENDAR] error", error); setIsRefreshing(false); },
      { isAdmin },
    );
    return unsub;
  }, [isFocused, weekStart, user]);

  // ─── Duties subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isFocused || !user) return;
    const weekEnd = addDays(weekStart, 7);
    const unsub = subscribeToWeekDuties(
      weekStart,
      weekEnd,
      setDuties,
      (error) => console.error("[CALENDAR] duties error", error),
    );
    return unsub;
  }, [isFocused, weekStart, user]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const filteredDuties = useMemo(() => {
    if (dutyFilter === "all" || !userPhone) return duties;
    const normalizePhone = (p: string) => p.replace(/\D/g, "");
    const myPhone = normalizePhone(userPhone);
    return duties.filter((d) => normalizePhone(d.dutyOfficerPhone ?? "") === myPhone);
  }, [duties, dutyFilter, userPhone]);

  const bookingLayoutByDay = useMemo(() => {
    const layout: Record<string, Record<string, { left: number; width: number }>> = {};
    days.forEach((day) => {
      layout[day.toISOString()] = getDayBookingLayout(day, filteredBookings);
    });
    return layout;
  }, [days, filteredBookings]);

  const slideAnim = useState(new Animated.Value(0))[0];
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderMove: Animated.event([null, { dx: slideAnim }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        Animated.timing(slideAnim, { toValue: -400, duration: 200, useNativeDriver: false }).start(() => {
          setWeekOffset((o) => o + 1);
          slideAnim.setValue(0);
        });
      } else if (gestureState.dx > 50) {
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: false }).start(() => {
          setWeekOffset((o) => o - 1);
          slideAnim.setValue(0);
        });
      } else {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false }).start();
      }
    },
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={theme.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerTitle: () => (
            <Pressable
              onPress={toggleCalendarMode}
              style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 5,
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 16, color: colors.black }}>
                {isDutiesMode ? "Dyżury" : "Yachtbooking"}
              </Text>
              <Icon name="swap-horizontal-outline" size={14} color={colors.black} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
              <Text style={[theme.textSecondary, { marginRight: 6 }]}>Odwołane</Text>
              <Switch
                value={showCancelledBookings}
                onValueChange={setShowCancelledBookings}
                trackColor={{ false: colors.lightGrey, true: colors.primary }}
                thumbColor={showCancelledBookings ? colors.primary : colors.white}
                style={{ marginRight: 8 }}
              />
            </View>
          ),
        }}
      />

      {/* Duty filter — only in duties mode */}
      {isDutiesMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            theme.cardPadding,
            theme.gridBorderBottom,
            { backgroundColor: colors.white, paddingVertical: 8, minHeight: 40, maxHeight: 80 },
          ]}
          contentContainerStyle={{ alignItems: "center", minHeight: "50%" }}
        >
          {(["all", "mine"] as const).map((f) => (
            <Pressable
              key={f}
              style={[
                theme.pill,
                {
                  marginRight: 8,
                  backgroundColor: dutyFilter === f ? colors.primary : colors.lightGrey,
                  paddingVertical: 4,
                  height: "125%",
                },
              ]}
              onPress={() => setDutyFilter(f)}
            >
              <Text style={{ color: colors.white }}>
                {f === "all" ? "Wszystkie" : "Moje"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Yacht filter — only in yachtbooking mode */}
      {!isDutiesMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            theme.cardPadding,
            theme.gridBorderBottom,
            { backgroundColor: colors.white, paddingVertical: 8, minHeight: 40, maxHeight: 80 },
          ]}
          contentContainerStyle={{ alignItems: "center", minHeight: "50%" }}
        >
          <Pressable
            style={[
              theme.pill,
              {
                marginRight: 8,
                backgroundColor: selectedYachtIds.length === 0 ? colors.primary : colors.lightGrey,
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
                  { marginRight: 8, backgroundColor: isSelected ? colors.primary : colors.lightGrey, height: "125%" },
                ]}
                onPress={() => {
                  setSelectedYachtIds((prev) =>
                    isSelected ? prev.filter((id) => id !== yacht.id) : [...prev, yacht.id],
                  );
                }}
              >
                <Text style={{ color: colors.white }} numberOfLines={1}>
                  {settings.useYachtShortcuts && yacht.shortcut ? yacht.shortcut : yacht.name || "Unnamed"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Week jump */}
      <View style={[theme.row, theme.gridBorderBottom, { padding: spacing.xs, alignItems: "center" }]}>
        <Pressable onPress={() => setWeekOffset((o) => o - 1)} style={theme.iconButton}>
          <Icon name="chevron-back-outline" size={24} color={colors.black} />
        </Pressable>
        <Pressable onPress={() => setShowWeekPicker(true)} style={{ flex: 1, alignItems: "center" }}>
          <Text style={theme.textPrimary}>{weekLabel(weekStart)}</Text>
        </Pressable>
        <Pressable onPress={() => setWeekOffset((o) => o + 1)} style={theme.iconButton}>
          <Icon name="chevron-forward-outline" size={24} color={colors.black} />
        </Pressable>
      </View>

      {/* Calendar */}
      <Animated.View
        style={{ paddingBottom: 137, transform: [{ translateX: slideAnim }] }}
        {...panResponder.panHandlers}
      >
        {/* Day headers */}
        <View style={theme.gridRow}>
          <View style={[theme.gridCellCenter, theme.gridBorderRight, { width: 40 }]} />
          {days.map((day) => {
            const isToday = sameDay(day, today);
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/calendar/day",
                    params: {
                      day: day.toISOString(),
                      showCancelled: showCancelledBookings ? "1" : "0",
                      selectedYachts: selectedYachtIds.join(","),
                    },
                  });
                }}
                style={[
                  theme.gridCellCenter,
                  theme.gridBorderRight,
                  { flex: 1, paddingVertical: 6 },
                  isToday && theme.highlightBackground,
                ]}
              >
                <Text style={isToday ? theme.highlightText : theme.textSecondary}>
                  {day.toLocaleDateString("pl-PL", { weekday: "short" })}
                </Text>
                <Text style={isToday ? theme.highlightText : theme.textSecondary}>
                  {formatDate(day)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          ref={calendarScrollRef}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          scrollEnabled={true}
          onLayout={updateCalendarGridTopOffset}
          contentContainerStyle={{ paddingBottom: calendarScrollBottomPadding }}
          style={
            Platform.OS === "web" && webCalendarScrollHeight
              ? { height: webCalendarScrollHeight }
              : undefined
          }
        >
          {HOURS.map((h) => (
            <View key={h} style={styles.row}>
              <View style={[theme.gridCellTopCenter, theme.gridBorderRight, { width: 40 }]}>
                <Text style={theme.textXs}>{String(h).padStart(2, "0")}:00</Text>
              </View>

              {days.map((day) => {
                const isToday = sameDay(day, today);
                const dayLayout = bookingLayoutByDay[day.toISOString()] ?? {};

                return (
                  <View
                    key={day.toISOString() + h}
                    pointerEvents="box-none"
                    style={[
                      theme.gridBorderRight,
                      theme.gridBorderBottom,
                      { flex: 1, height: HOUR_ROW_HEIGHT },
                      isToday && { backgroundColor: "rgba(0, 80, 200, 0.08)" },
                    ]}
                  >
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => {
                        if (suppressGridPressRef.current) {
                          suppressGridPressRef.current = false;
                          return;
                        }
                        if (isDutiesMode) {
                          if (canManageDuty) {
                            setPendingSlot({ day: day.toISOString(), hour: h });
                            setTimeout(() => {
                              const startDate = new Date(day);
                              startDate.setHours(h, 0, 0, 0);
                              const endDate = new Date(day);
                              endDate.setHours(h + 1, 0, 0, 0);
                              router.push({
                                pathname: "/book",
                                params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
                              });
                              setPendingSlot(null);
                            }, 200);
                          }
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
                        if (bookingAtSlot) { setSelectedBooking(bookingAtSlot); return; }
                        setPendingSlot({ day: day.toISOString(), hour: h });
                        setTimeout(() => {
                          const startDate = new Date(day);
                          startDate.setHours(h, 0, 0, 0);
                          const endDate = new Date(startDate);
                          endDate.setHours(h + 1, 0, 0, 0);
                          router.push({
                            pathname: "/book",
                            params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
                          });
                          setPendingSlot(null);
                        }, 200);
                      }}
                    >
                      {pendingSlot &&
                        pendingSlot.day === day.toISOString() &&
                        pendingSlot.hour === h && (
                          <View
                            style={{
                              position: "absolute",
                              top: 1, left: 1, right: 1, bottom: 1,
                              borderWidth: 1,
                              borderColor: colors.primary,
                              borderRadius: 6,
                              backgroundColor: "rgba(0,0,0,0)",
                              zIndex: 10,
                            }}
                          />
                        )}
                    </Pressable>

                    {/* ── YACHTBOOKING MODE: duty bar (10%) + bookings (90%) ─── */}
                    {!isDutiesMode && h === 0 && (
                      <>
                        {/* Duty bars — fioletowy, 10% left */}
                        {duties.map((duty) => {
                          const dutyStyle = getDutyStyleForDay(duty, day);
                          if (!dutyStyle) return null;
                          return (
                            <View
                              key={duty.id}
                              pointerEvents="none"
                              style={{
                                position: "absolute",
                                left: 0,
                                width: `${DUTY_BAR_WIDTH_PERCENT}%`,
                                top: dutyStyle.top,
                                height: dutyStyle.height,
                                backgroundColor: colors.primaryLight,
                                opacity: 0.75,
                                borderRadius: 3,
                                zIndex: 8,
                              }}
                            />
                          );
                        })}

                        {/* Bookings — shifted to 90% right */}
                        {filteredBookings.map((b) => {
                          const layout = getBookingStyle(b, day);
                          if (!layout) return null;
                          const columnLayout = dayLayout[b.id];
                          if (!columnLayout) return null;
                          const backgroundColor = getBookingBackgroundColor(b, user?.uid);
                          const fontColor = getBookingFontColor(b, user?.uid);
                          const displayYacht = getBookingYachtLabel(b, yachtMap, settings.useYachtShortcuts);

                          const leftPct =
                            DUTY_BAR_WIDTH_PERCENT +
                            (columnLayout.left / 100) * BOOKING_WIDTH_PERCENT;
                          const widthPct = (columnLayout.width / 100) * BOOKING_WIDTH_PERCENT;

                          return (
                            <Pressable
                              key={b.id}
                              style={[
                                theme.absoluteCard,
                                {
                                  backgroundColor,
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  overflow: "hidden",
                                  zIndex: 10,
                                  elevation: 5,
                                },
                                layout,
                              ]}
                              onPressIn={() => { suppressGridPressRef.current = true; }}
                              onPressOut={() => { setTimeout(() => { suppressGridPressRef.current = false; }, 0); }}
                              onPress={(e) => { e?.stopPropagation?.(); setSelectedBooking(b); }}
                            >
                              <Text style={[theme.textXs, { fontWeight: "600", color: fontColor }]}>
                                {displayYacht}
                              </Text>
                              <Text style={[theme.textXs, { color: fontColor }]}>{b.userName}</Text>
                            </Pressable>
                          );
                        })}
                      </>
                    )}

                    {/* ── DUTIES MODE: merged booking bars + duty rectangles ─── */}
                    {isDutiesMode && h === 0 && (
                      <>
                        {/* Merged booking bars — granatowe, 10% left */}
                        {/* {getMergedBookingIntervals(day, filteredBookings).map((iv, idx) => (
                          <View
                            key={`merged-${idx}`}
                            pointerEvents="none"
                            style={{
                              position: "absolute",
                              left: 0,
                              width: `${DUTY_BAR_WIDTH_PERCENT}%`,
                              top: iv.top,
                              height: iv.height,
                              backgroundColor: colors.primary,
                              borderRadius: 3,
                              zIndex: 7,
                            }}
                          />
                        ))} */}

                        {/* Duty rectangles — fioletowe, klikalny, styl jak booking, 90% right */}
                        {filteredDuties.map((duty) => {
                          const dutyStyle = getDutyStyleForDay(duty, day);
                          if (!dutyStyle) return null;
                          return (
                            <Pressable
                              key={duty.id}
                              style={[
                                theme.absoluteCard,
                                {
                                  backgroundColor: colors.primaryLight,
                                  left: `${DUTY_BAR_WIDTH_PERCENT}%`,
                                  width: `${BOOKING_WIDTH_PERCENT}%`,
                                  overflow: "hidden",
                                  zIndex: 10,
                                  elevation: 5,
                                },
                                dutyStyle,
                              ]}
                              onPressIn={() => { suppressGridPressRef.current = true; }}
                              onPressOut={() => { setTimeout(() => { suppressGridPressRef.current = false; }, 0); }}
                              onPress={(e) => { e?.stopPropagation?.(); setSelectedDuty(duty); }}
                            >
                              <Text style={[theme.textXs, { fontWeight: "600", color: colors.white }]}>
                                {duty.dutyOfficerName}
                              </Text>
                              {duty.dutyOfficerPhone ? (
                                <Text style={[theme.textXs, { color: colors.white }]}>
                                  {duty.dutyOfficerPhone}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Booking detail modal ─────────────────────────────────────────── */}
      {selectedBooking && (
        <Pressable
          style={theme.modalOverlay}
          onPress={() => {
            setSelectedBooking(null);
            setShowNoteEditor(false);
            setShowAdminRejectInput(false);
            setAdminRejectReason("");
          }}
        >
          <Pressable style={theme.modal} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={theme.title}>
                {getBookingYachtLabel(selectedBooking, yachtMap, settings.useYachtShortcuts)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {isAdmin && (
                  <Pressable
                    onPress={() => {
                      setSelectedBooking(null);
                      router.push({ pathname: "/(tabs)/book", params: { copyBookingId: selectedBooking.id } });
                    }}
                    style={{ padding: 4 }}
                    accessibilityLabel="Kopiuj rezerwację"
                  >
                    <Icon name="copy-outline" size={22} color={colors.primary} />
                  </Pressable>
                )}
                {canEditSelectedBooking && (
                  <Pressable
                    onPress={() => {
                      setSelectedBooking(null);
                      router.push({ pathname: "/(tabs)/book", params: { bookingId: selectedBooking.id, edit: "1" } });
                    }}
                    style={{ padding: 4 }}
                    accessibilityLabel="Edytuj rezerwację"
                  >
                    <Icon name="pencil" size={22} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              {modalUserPhoto ? (
                <Image source={{ uri: modalUserPhoto }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
              ) : (
                <Image source={require("@/assets/images/user_placeholder.png")} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
              )}
              <Text style={theme.textPrimary}> {selectedBooking.userName}</Text>
            </View>

            <Text style={[theme.textPrimary, { marginBottom: 8 }]}>
              ⏰{" "}
              {selectedBooking.start.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {selectedBooking.end.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Text style={theme.textPrimary}>
                {"Status: "}{getBookingStatusLabel(selectedBooking.status)}
              </Text>
              {selectedBooking.status === BookingStatus.Rejected && selectedBooking.rejectionReason ? (
                <Pressable
                  onPress={() => Alert.alert("Powód odrzucenia", selectedBooking.rejectionReason)}
                  style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: colors.white, fontSize: 11, fontWeight: "700" }}>?</Text>
                </Pressable>
              ) : null}
            </View>

            {selectedBooking.status === BookingStatus.NoDutyOfficer && (
              <View style={{ backgroundColor: colors.warningSoft, borderRadius: 6, padding: 8, marginBottom: 8 }}>
                <Text style={{ color: colors.warning, fontSize: 12 }}>
                  Brak dyżurnego w terminie rezerwacji. Status zmieni się automatycznie po dodaniu dyżuru.
                </Text>
              </View>
            )}

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
                      {`${formatNoteDate(note.createdAt)}, ${getNoteAuthorName(note)}: ${note.content}`}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {(isOwnSelectedBooking || isAdmin) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Pressable
                  style={{ backgroundColor: colors.lightGrey, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 }}
                  onPress={() => { setBookingNote(""); setShowNoteEditor(true); }}
                >
                  <Text style={theme.textPrimary}>Zgłoś</Text>
                </Pressable>
                {selectedBooking.status !== BookingStatus.Rejected &&
                  selectedBooking.status !== BookingStatus.Cancelled && (
                    <Pressable
                      style={{ backgroundColor: colors.danger, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 }}
                      onPress={async () => {
                        await updateBookingStatus(selectedBooking.id, BookingStatus.Cancelled);
                        setSelectedBooking(null);
                        setShowNoteEditor(false);
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: "bold" }}>Odwołaj</Text>
                    </Pressable>
                  )}
              </View>
            )}

            {/* Admin Approve/Reject Buttons */}
            {canApproveBooking && selectedBooking && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <Pressable
                  style={{ backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6, marginRight: 8, minWidth: 90, alignItems: "center" }}
                  onPress={async () => {
                    updateBookingStatus(selectedBooking.id, BookingStatus.Approved);
                    setSelectedBooking(null);
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "bold" }}>Akceptuj</Text>
                </Pressable>
                <Pressable
                  style={{ backgroundColor: colors.danger, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6, minWidth: 90, alignItems: "center" }}
                  onPress={() => { setAdminRejectReason(""); setShowAdminRejectInput(true); }}
                >
                  <Text style={{ color: colors.white, fontWeight: "bold" }}>Odrzuć</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={{ marginTop: 16, alignSelf: "flex-end" }}
              onPress={() => {
                setSelectedBooking(null);
                setShowNoteEditor(false);
                setShowAdminRejectInput(false);
                setAdminRejectReason("");
              }}
            >
              <Text style={theme.link}>Zamknij</Text>
            </Pressable>
          </Pressable>

          {showAdminRejectInput && (
            <Pressable style={theme.modalOverlay} onPress={() => setShowAdminRejectInput(false)}>
              <Pressable style={theme.modal} onPress={(e) => e.stopPropagation()}>
                <Text style={theme.title}>Powód odrzucenia</Text>
                <TextInput
                  value={adminRejectReason}
                  onChangeText={setAdminRejectReason}
                  style={[theme.input, theme.inputDefaultText, { minHeight: 90 }]}
                  placeholder="Wpisz powód odrzucenia"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                  <Pressable onPress={() => setShowAdminRejectInput(false)}>
                    <Text style={theme.link}>Anuluj</Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      const reason = adminRejectReason.trim();
                      if (!reason || !selectedBooking?.id) return;
                      await updateBookingStatus(selectedBooking.id, BookingStatus.Rejected, reason);
                      setShowAdminRejectInput(false);
                      setSelectedBooking(null);
                    }}
                    disabled={!adminRejectReason.trim()}
                  >
                    <Text style={[theme.link, !adminRejectReason.trim() && { opacity: 0.4 }]}>Odrzuć</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          )}

          {showNoteEditor && (
            <Pressable style={theme.modalOverlay} onPress={() => setShowNoteEditor(false)}>
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
                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                  <Pressable onPress={() => setShowNoteEditor(false)}>
                    <Text style={theme.link}>Anuluj</Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (!selectedBooking?.id || !user?.uid) return;
                      const trimmed = bookingNote.trim();
                      if (!trimmed) { Alert.alert("Błąd", "Notatka nie może być pusta"); return; }
                      setSavingNote(true);
                      try {
                        await createNote({ bookingId: selectedBooking.id, content: trimmed, creatorId: user.uid, creatorWasAdmin: isAdmin });
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
                    const offset = i - 2;
                    const start = addDays(baseWeekStart, offset * 7);
                    return (
                      <Pressable
                        key={offset}
                        style={[theme.listItem, offset === weekOffset && theme.listItemActive]}
                        onPress={() => { setWeekOffset(offset); setShowWeekPicker(false); }}
                      >
                        <Text style={offset === weekOffset ? theme.textOnPrimary : theme.textPrimary}>
                          {weekLabel(start)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable onPress={() => setShowWeekPicker(false)} style={{ marginTop: 16, alignSelf: "flex-end" }}>
                  <Text style={theme.link}>Zamknij</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      )}

      {/* ── Duty detail modal ─────────────────────────────────────────────── */}
      {selectedDuty && (
        <Pressable style={theme.modalOverlay} onPress={() => setSelectedDuty(null)}>
          <Pressable style={theme.modal} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={theme.title}>Dyżur</Text>
              {canManageDuty && (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      const duty = selectedDuty;
                      setSelectedDuty(null);
                      router.push({ pathname: "/(tabs)/book", params: { dutyId: duty.id, edit: "1" } });
                    }}
                    style={{ padding: 4 }}
                    accessibilityLabel="Edytuj dyżur"
                  >
                    <Icon name="pencil" size={22} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const duty = selectedDuty;
                      Alert.alert(
                        "Usuń dyżur",
                        `Czy na pewno chcesz usunąć dyżur ${duty.dutyOfficerName}?`,
                        [
                          { text: "Anuluj", style: "cancel" },
                          {
                            text: "Usuń",
                            style: "destructive",
                            onPress: async () => {
                              setSelectedDuty(null);
                              await softDeleteDuty(duty.id);
                            },
                          },
                        ],
                      );
                    }}
                    style={{ padding: 4 }}
                    accessibilityLabel="Usuń dyżur"
                  >
                    <Icon name="trash-outline" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              )}
            </View>
            <Text style={[theme.textPrimary, { marginBottom: 4 }]}>
              👤 {selectedDuty.dutyOfficerName}
            </Text>
            {selectedDuty.dutyOfficerPhone ? (
              <Text style={[theme.textSecondary, { marginBottom: 8 }]}>
                📞 {selectedDuty.dutyOfficerPhone}
              </Text>
            ) : null}
            <Text style={[theme.textPrimary, { marginBottom: 16 }]}>
              ⏰{" "}
              {selectedDuty.start?.toDate?.()?.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}{" "}
              {selectedDuty.start?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {selectedDuty.end?.toDate?.()?.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}{" "}
              {selectedDuty.end?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Pressable onPress={() => setSelectedDuty(null)} style={{ alignSelf: "flex-end" }}>
              <Text style={theme.link}>Zamknij</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {/* Week picker modal (triggered from outside selectedBooking context) */}
      {showWeekPicker && !selectedBooking && (
        <View style={theme.modalOverlay}>
          <View style={theme.modal}>
            <Text style={theme.title}>Wybierz tydzień</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {Array.from({ length: 12 }, (_, i) => {
                const offset = i - 2;
                const start = addDays(baseWeekStart, offset * 7);
                return (
                  <Pressable
                    key={offset}
                    style={[theme.listItem, offset === weekOffset && theme.listItemActive]}
                    onPress={() => { setWeekOffset(offset); setShowWeekPicker(false); }}
                  >
                    <Text style={offset === weekOffset ? theme.textOnPrimary : theme.textPrimary}>
                      {weekLabel(start)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setShowWeekPicker(false)} style={{ marginTop: 16, alignSelf: "flex-end" }}>
              <Text style={theme.link}>Zamknij</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
