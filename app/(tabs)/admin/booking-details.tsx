import { BookingStatus } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { User } from "@/src/entities/user";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToBooking, updateBookingStatus } from "@/src/services/booking.service";
import { subscribeToNotesForBooking } from "@/src/services/noteService";
import { subscribeToAllUsers } from "@/src/services/userService";
import { styles as theme } from "@/src/theme/styles";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const unsub = subscribeToBooking(bookingId, (booking) => {
      if (!booking) return;
      setBooking(booking);
    });

    return unsub;
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;

    const unsub = subscribeToNotesForBooking(bookingId, (nextNotes) => {
      const sorted = [...nextNotes].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const bTime = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return aTime - bTime;
      });
      setNotes(sorted);
    });

    return unsub;
  }, [bookingId]);

  useEffect(() => {
    const unsub = subscribeToAllUsers(
      (nextUsers) => {
        setUsers(nextUsers);
      },
      (error) => {
        console.error("[BOOKING DETAILS] users snapshot error:", error);
      },
    );

    return unsub;
  }, []);

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
  const notesShouldScroll = notes.length > NOTE_VISIBLE_COUNT;


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

      {notes.length > 0 ? (
        <View style={{ marginVertical: 16 }}>
          <Text style={theme.textMuted}>Notatki</Text>
          <ScrollView
            nestedScrollEnabled
            style={notesShouldScroll ? { maxHeight: notesMaxHeight, marginTop: 8 } : { marginTop: 8 }}
            contentContainerStyle={{ paddingRight: 2 }}
          >
            {notes.map((note, index) => (
              <Text
                key={note.id}
                style={[
                  theme.textSecondary,
                  {
                    lineHeight: NOTE_LINE_HEIGHT,
                    paddingVertical: NOTE_VERTICAL_PADDING,
                    marginBottom: index === notes.length - 1 ? 0 : NOTE_ITEM_GAP,
                  },
                ]}
              >
                {`${formatNoteDate(note.createdAt)}, ${getNoteAuthorName(note)}: ${note.content}`}
              </Text>
            ))}
          </ScrollView>
        </View>
      ) : null}

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
