import Icon from "@/src/components/Icon";
import { Booking } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { User } from "@/src/entities/user";
import { useTheme } from "@/src/providers/ThemeContext";
import { subscribeToBooking } from "@/src/services/booking.service";
import { rejectNote, subscribeToNote, updateNoteReadStatus } from "@/src/services/noteService";
import { subscribeToAllUsers } from "@/src/services/userService";
import { createStyles } from "@/src/theme/styles";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

type BookingInfo = Booking | null;

export default function NoteDetailsScreen() {
  const { colors } = useTheme();
  const theme = createStyles(colors);
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [booking, setBooking] = useState<BookingInfo>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllUsers(
      (nextUsers) => setUsers(nextUsers),
      (error) => {
        console.error("[NOTE DETAILS] users snapshot error:", error);
      },
    );

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToNote(
      noteId ?? "",
      (nextNote) => setNote(nextNote),
      (error) => {
        console.error("[NOTE DETAILS] note snapshot error:", error);
      },
    );

    return unsub;
  }, [noteId]);

  useEffect(() => {
    if (!note?.bookingId) {
      setBooking(null);
      return;
    }

    const unsub = subscribeToBooking(note.bookingId, (nextBooking) => {
      setBooking(nextBooking);
    });

    return unsub;
  }, [note?.bookingId]);

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

  const creatorName = useMemo(() => {
    if (!note) return "Nieznany autor";
    return userNameMap[note.creatorId] ?? (note.creatorWasAdmin ? "Admin" : "Użytkownik");
  }, [note, userNameMap]);

  const bookerName = useMemo(() => {
    if (!booking) return "Nieznany użytkownik";
    return userNameMap[booking.userId] ?? booking.userName ?? "Nieznany użytkownik";
  }, [booking, userNameMap]);

  const bookingYachtLabel = useMemo(() => {
    if (!booking) return "Nieznany jacht";
    const yachtNames = booking.yachtNames ?? (booking.yachtName ? [booking.yachtName] : []);
    return yachtNames.join(", ") || "Nieznany jacht";
  }, [booking]);

  const toggleReadStatus = async () => {
    if (!note || !noteId) return;
    
    const newReadStatus = !note.read;
    const actionText = newReadStatus ? "przeczytaną" : "nieprzeczytaną";
    
    setUpdating(true);
    try {
      await updateNoteReadStatus(noteId, newReadStatus);
    } catch (error) {
      console.error("[NOTE DETAILS] update read status error:", error);
      Alert.alert("Błąd", "Nie udało się zaktualizować statusu notatki");
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectNote = async () => {
    if (!note || !noteId) return;

    Alert.alert(
      "Usuń notatkę",
      "Na pewno chcesz usunąć tę notatkę? Nie będzie ona wyświetlana nigdzie.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              await rejectNote(noteId);
              router.back();
            } catch (error) {
              console.error("[NOTE DETAILS] reject note error:", error);
              Alert.alert("Błąd", "Nie udało się usunąć notatki");
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (!note) {
    return (
      <View style={[theme.screenPadded, theme.center]}>
        <Text style={theme.textMuted}>Ładowanie notatki...</Text>
      </View>
    );
  }

  const isRead = note.read === true || String(note.read).toLowerCase() === "true";

  return (
    <ScrollView style={theme.screenPadded} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={theme.title}>{bookingYachtLabel}</Text>
      <Text style={theme.textSecondary}>{bookerName}</Text>

      <View style={{ marginVertical: 20 }}>
        <Text style={theme.textMuted}>Treść notatki</Text>
        <Text style={theme.textPrimary}>{note.content}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={theme.textMuted}>Autor notatki</Text>
        <Text style={theme.textPrimary}>{creatorName}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={theme.textMuted}>Status</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Text style={[theme.textPrimary, { marginRight: 12 }]}>
            {isRead ? "Przeczytana" : "Nieprzeczytana"}
          </Text>
          <Pressable
            onPress={toggleReadStatus}
            disabled={updating}
            style={[
              theme.button,
              {
                paddingVertical: 6,
                paddingHorizontal: 12,
                opacity: updating ? 0.5 : 1,
                backgroundColor: isRead ? colors.lightGrey : colors.primary,
                width: "auto",
              },
            ]}
          >
            <Text
              style={[
                theme.buttonText,
                { fontSize: 14, color: isRead ? colors.black : colors.white },
              ]}
            >
              {updating ? "Zapisywanie..." : isRead ? "Oznacz jako nieprzeczytaną" : "Oznacz jako przeczytaną"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={theme.textMuted}>Data utworzenia notatki</Text>
        <Text style={theme.textPrimary}>
          {note.createdAt
            ? dayjs(note.createdAt.toDate()).format("DD MMM YYYY HH:mm")
            : "Brak danych"}
        </Text>
      </View>

      <View>
        <Text style={theme.textMuted}>Data i czas rezerwacji</Text>
        <Text style={theme.textPrimary}>
          {booking?.start && booking?.end
            ? `${dayjs(booking.start.toDate()).format("DD MMM YYYY HH:mm")} – ${dayjs(booking.end.toDate()).format("DD MMM YYYY HH:mm")}`
            : "Brak danych daty i czasu"}
        </Text>
      </View>

      <View style={{ marginTop: 24, alignItems: "flex-end" }}>
        <Pressable
          onPress={handleRejectNote}
          disabled={updating}
          style={{
            padding: 10,
            opacity: updating ? 0.5 : 1,
          }}
        >
          <Icon name="trash" size={28} color={colors.danger} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
