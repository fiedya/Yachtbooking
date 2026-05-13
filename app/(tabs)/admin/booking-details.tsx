import { BookingStatus } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToBooking, updateBookingStatus } from "@/src/services/booking.service";
import { subscribeToNotesForBooking } from "@/src/services/noteService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const NOTE_VISIBLE_COUNT = 3;
const NOTE_LINE_HEIGHT = 18;
const NOTE_VERTICAL_PADDING = 3;
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
      <Text style={theme.textSecondary}>{label}</Text>
      <Text style={[theme.textPrimary, { fontWeight: "500", flexShrink: 1, textAlign: "right" }]}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const label = getBookingStatusLabel(status);
  let bg = colors.lightGrey;
  let fg = colors.textSecondary;
  if (status === BookingStatus.Approved) { bg = colors.secondary; fg = colors.white; }
  if (status === BookingStatus.Rejected || status === BookingStatus.Cancelled) {
    bg = colors.dangerSoft; fg = colors.danger;
  }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start" }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: fg }}>{label}</Text>
    </View>
  );
}

type BookingDetails = {
  id: string;
  yachtName?: string;
  yachtNames?: string[];
  userName: string;
  start: any;
  end: any;
  status: BookingStatus;
  rejectionReason?: string;
};

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [updating, setUpdating] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const getBookingYachtLabel = (booking: BookingDetails) => {
    const yachtNames = booking.yachtNames ?? (booking.yachtName ? [booking.yachtName] : []);
    return yachtNames.join(", ");
  };

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

  const getNoteAuthorName = (note: Note) => note.creatorWasAdmin ? "Admin" : "Użytkownik";

  const notesMaxHeight =
    NOTE_VISIBLE_COUNT * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
    (NOTE_VISIBLE_COUNT - 1) * NOTE_ITEM_GAP;
  const notesShouldScroll = notes.length > NOTE_VISIBLE_COUNT;

  if (!booking) {
    return (
      <View style={[theme.screenPadded, theme.center]}>
        <Text style={theme.textMuted}>Ładowanie…</Text>
      </View>
    );
  }

  async function handleApprove() {
    if (!booking) return;
    const message = "Na pewno chcesz zaakceptować ten booking?";

    if (Platform.OS === "web") {
      if (!window.confirm(message)) return;
      setUpdating(true);
      try {
        await updateBookingStatus(booking.id, BookingStatus.Approved);
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
            await updateBookingStatus(booking.id, BookingStatus.Approved);
            router.back();
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  }

  async function handleRejectConfirm() {
    if (!booking) return;
    const reason = rejectReason.trim();
    if (!reason) return;
    setUpdating(true);
    try {
      await updateBookingStatus(booking.id, BookingStatus.Rejected, reason);
      router.back();
    } finally {
      setUpdating(false);
    }
  }

  const startDate = booking.start?.toDate?.();
  const endDate = booking.end?.toDate?.();
  const isApproved = booking.status === BookingStatus.Approved;
  const isRejected = booking.status === BookingStatus.Rejected;

  return (
    <ScrollView style={theme.screenPadded} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Booking info card */}
      <View style={{ backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <InfoRow label="Jacht" value={getBookingYachtLabel(booking)} />
        <InfoRow label="Użytkownik" value={booking.userName} />
        <InfoRow
          label="Od"
          value={dayjs(startDate).format("DD MMM YYYY HH:mm")}
        />
        <InfoRow
          label="Do"
          value={dayjs(endDate).format("DD MMM YYYY HH:mm")}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
          <Text style={theme.textSecondary}>Status</Text>
          <StatusBadge status={booking.status} />
        </View>
      </View>

      {isRejected && booking.rejectionReason && (
        <View style={{ backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <Text style={{ color: colors.danger, fontWeight: "600", marginBottom: 4 }}>Powód odrzucenia</Text>
          <Text style={{ color: colors.danger }}>{booking.rejectionReason}</Text>
        </View>
      )}

      {notes.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={theme.sectionTitle}>Notatki</Text>
          <ScrollView
            nestedScrollEnabled
            style={notesShouldScroll ? { maxHeight: notesMaxHeight } : undefined}
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
      )}

      {!isApproved && (
        <Pressable
          style={[theme.button, { marginBottom: 12, opacity: updating ? 0.5 : 1 }]}
          onPress={handleApprove}
          disabled={updating}
        >
          <Text style={theme.buttonText}>
            {updating ? "Przetwarzanie..." : "Akceptuj"}
          </Text>
        </Pressable>
      )}

      {!isRejected && !showRejectInput && (
        <Pressable
          style={[theme.button, theme.buttonDanger, { opacity: updating ? 0.5 : 1 }]}
          onPress={() => { setRejectReason(""); setShowRejectInput(true); }}
          disabled={updating}
        >
          <Text style={theme.buttonDangerText}>Odrzuć</Text>
        </Pressable>
      )}

      {showRejectInput && (
        <View style={[theme.card, theme.cardPadding, { marginTop: 8 }]}>
          <Text style={[theme.sectionTitle, { marginBottom: 8 }]}>Podaj powód odrzucenia</Text>
          <TextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Wpisz powód odrzucenia..."
            placeholderTextColor={colors.textSecondary}
            style={[theme.input, theme.inputDefaultText, { minHeight: 80 }]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Pressable
              style={[theme.button, theme.buttonDanger, { flex: 1, opacity: updating || !rejectReason.trim() ? 0.5 : 1 }]}
              onPress={handleRejectConfirm}
              disabled={updating || !rejectReason.trim()}
            >
              <Text style={theme.buttonDangerText}>
                {updating ? "Zapisywanie..." : "Potwierdź odrzucenie"}
              </Text>
            </Pressable>
            <Pressable
              style={[theme.button, { flex: 1 }]}
              onPress={() => setShowRejectInput(false)}
              disabled={updating}
            >
              <Text style={theme.buttonText}>Anuluj</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
