import WebDatePicker from "@/src/components/WebDatePicker";
import { Booking } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { User } from "@/src/entities/user";
import { subscribeToUpcomingBookingsShared } from "@/src/services/booking.service";
import { subscribeToNotesForBookingIds } from "@/src/services/noteService";
import { subscribeToAllUsers } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

type SortOption = "yachtName" | "userName" | "createdAt" | "bookingDay" | "read";

export default function NewNotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("bookingDay");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [filterStartDate, setFilterStartDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const [filterEndDate, setFilterEndDate] = useState(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 14);
    return end;
  });

  const windowStart = useMemo(() => {
    const start = new Date(filterStartDate);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [filterStartDate]);

  const windowEnd = useMemo(() => {
    const end = new Date(filterEndDate);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return end;
  }, [filterEndDate]);

  useEffect(() => {
    if (filterEndDate < filterStartDate) {
      setFilterEndDate(new Date(filterStartDate));
    }
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    setLoading(true);

    const unsub = subscribeToUpcomingBookingsShared(
      windowStart,
      windowEnd,
      (nextBookings) => {
        setBookings(nextBookings);
      },
      (error) => {
        console.error("[NEW NOTES] bookings snapshot error:", error);
        setLoading(false);
      },
    );

    return unsub;
  }, [windowStart, windowEnd]);

  useEffect(() => {
    const bookingIds = bookings.map((booking) => booking.id);

    const unsub = subscribeToNotesForBookingIds(
      bookingIds,
      (nextNotes) => {
        setNotes(nextNotes);
        setLoading(false);
      },
      (error) => {
        console.error("[NEW NOTES] notes snapshot error:", error);
        setLoading(false);
      },
    );

    return unsub;
  }, [bookings]);

  useEffect(() => {
    const unsub = subscribeToAllUsers(
      (nextUsers) => {
        setUsers(nextUsers);
      },
      (error) => {
        console.error("[NEW NOTES] users snapshot error:", error);
      },
    );

    return unsub;
  }, []);

  const bookingMap = useMemo(() => {
    const map: Record<string, Booking> = {};
    bookings.forEach((booking) => {
      map[booking.id] = booking;
    });
    return map;
  }, [bookings]);

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((user) => {
      const fullName = `${user.name ?? ""} ${user.surname ?? ""}`.trim();
      if (fullName) {
        map[user.uid] = fullName;
      }
    });
    return map;
  }, [users]);

  const getBookingUserName = (booking?: Booking) => {
    if (!booking) return "Nieznany użytkownik";
    return userNameMap[booking.userId] ?? booking.userName ?? "Nieznany użytkownik";
  };

  const getBookingYachtLabel = (booking?: Booking) => {
    if (!booking) return "Nieznany jacht";
    const yachtNames = booking.yachtNames ?? (booking.yachtName ? [booking.yachtName] : []);
    return yachtNames.join(", ") || "Nieznany jacht";
  };

  const getCreatorName = (note: Note) => {
    return userNameMap[note.creatorId] ?? (note.creatorWasAdmin ? "Admin" : "Użytkownik");
  };

  const filteredAndSortedBookings = useMemo(() => {
    const isUnread = (note: Note) => String(note.read).toLowerCase() !== "true";

    let result = notes
      .filter((note) => isUnread(note))
      .map((note) => ({
        note,
        booking: bookingMap[note.bookingId],
      }));

    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        ({ note, booking }) =>
          getBookingUserName(booking).toLowerCase().includes(lowerSearch) ||
          getBookingYachtLabel(booking).toLowerCase().includes(lowerSearch) ||
          getCreatorName(note).toLowerCase().includes(lowerSearch) ||
          (note.content ?? "").toLowerCase().includes(lowerSearch),
      );
    }

    result.sort((a, b) => {
      const bookingA = a.booking;
      const bookingB = b.booking;
      if (sortBy === "read") {
        const aRead = a.note.read === true || String(a.note.read).toLowerCase() === "true";
        const bRead = b.note.read === true || String(b.note.read).toLowerCase() === "true";
        return (aRead === bRead) ? 0 : aRead ? 1 : -1;
      }
      if (sortBy === "yachtName") {
        return getBookingYachtLabel(bookingA).localeCompare(getBookingYachtLabel(bookingB));
      }
      if (sortBy === "userName") {
        return getBookingUserName(bookingA).localeCompare(getBookingUserName(bookingB));
      }
      if (sortBy === "createdAt") {
        const aTime = bookingA?.createdAt?.toDate?.().getTime?.() ?? 0;
        const bTime = bookingB?.createdAt?.toDate?.().getTime?.() ?? 0;
        return bTime - aTime;
      }

      const aStart = bookingA?.start?.toDate?.().getTime?.() ?? 0;
      const bStart = bookingB?.start?.toDate?.().getTime?.() ?? 0;
      return bStart - aStart;
    });

    return result;
  }, [notes, searchText, sortBy, bookingMap, userNameMap]);

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
          placeholder="Szukaj po rezerwującym, jachcie lub notatce..."
          value={searchText}
          onChangeText={setSearchText}
          style={[
            theme.input,
            theme.inputDefaultText,
            {
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.lightGrey,
              borderRadius: 6,
              marginBottom: 12,
            },
          ]}
          placeholderTextColor={colors.textSecondary}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <SortButton value="yachtName" label="Jacht" />
          <SortButton value="userName" label="Rezerwujący" />
          <SortButton value="createdAt" label="Data utworzenia" />
          <SortButton value="bookingDay" label="Dzień rezerwacji" />
          <SortButton value="read" label="Status" />
        </View>

        <View style={{ marginTop: 4 }}>
          <Text style={[theme.textMuted, { marginBottom: 6 }]}>Zakres dat</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={theme.textSecondary}>Start</Text>
            <WebDatePicker
              value={filterStartDate}
              onChange={(date) => setFilterStartDate(date)}
              mode="date"
            />
            <Text style={theme.textSecondary}>End</Text>
            <WebDatePicker
              value={filterEndDate}
              onChange={(date) => setFilterEndDate(date)}
              mode="date"
              minDate={filterStartDate}
            />
          </View>
        </View>
      </View>

      <FlatList
        contentContainerStyle={theme.listPadding}
        data={filteredAndSortedBookings}
        keyExtractor={(item) => item.note.id}
        renderItem={({ item }) => {
          const booking = item.booking;
          return (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/admin/note-details",
                params: { noteId: item.note.id },
              })
            }
          >
            <View style={[theme.card, theme.cardPadding]}>
              <Text style={theme.textPrimary}  numberOfLines={2}>
                {item.note.content}

              </Text>
              <Text style={theme.textSecondary}>
                {getBookingYachtLabel(booking)} ({getBookingUserName(booking)})
              </Text>
              <Text style={theme.textMuted}>
                {getCreatorName(item.note)}
              </Text>
                <Text style={theme.textMuted}>
                  {booking?.start
                    ? `${dayjs(booking.start?.toDate?.()).format("DD MMM YYYY hh:mm")} – ${dayjs(booking.end?.toDate?.()).format("DD MMM YYYY hh:mm")}`
                    : "Brak dat"}
                </Text>
                                <Text style={theme.textMuted}>
                  {booking?.start
                    ? `${dayjs(item.note.createdAt).format("DD MMM YYYY")}`
                    : "Brak dat"}
                </Text>
            </View>
          </Pressable>
        );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={theme.textMuted}>
              {searchText
                ? "Brak notatek spełniających kryteria"
                : "Brak nowych notatek"}
            </Text>
          ) : null
        }
      />
    </View>
  );
}
