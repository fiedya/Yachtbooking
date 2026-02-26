import Icon from "@/src/components/Icon";
import { Booking, BookingStatus } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { getCurrentUser, signOut } from "@/src/firebase/init";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { updateBookingStatus } from "@/src/services/booking.service";
import { subscribeToBookings } from "@/src/services/calendarService";
import { uploadImage } from "@/src/services/imageUploadService";
import { createNote, subscribeToNotesForBooking } from "@/src/services/noteService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { pickImageFromGallery } from "@/src/utils/pickImage";
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "../../../src/entities/user";
import { useMode } from "../../../src/providers/ModeProvider";
import {
    getUserPhotoUrl,
    subscribeToUser,
    updateUserAvatar,
    updateUserProfile,
} from "../../../src/services/userService";

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

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [editingField, setEditingField] = useState<
    "description" | null
  >(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const { mode, toggleMode } = useMode();
  const insets = useSafeAreaInsets();
  const { user, uid, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalUserPhoto, setModalUserPhoto] = useState<string | null>(null);
  const [bookingNotes, setBookingNotes] = useState<Note[]>([]);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [bookingNote, setBookingNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

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
        console.error("[PROFILE] notes snapshot error", error);
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

  const getBookingYachtLabel = (booking: any) => {
    const yachtNames = booking?.yachtNames ?? (booking?.yachtName ? [booking.yachtName] : []);
    return yachtNames.join(", ");
  };

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (data) => {
      setProfile(data);
      if (data) {
        setDescription(data.description || "");
      }
    });
    return unsub;
  }, [user?.uid]);

  // Subscribe to user's bookings from today onwards
  useEffect(() => {
    if (!user?.uid) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    // Far future date
    const end = new Date();
    end.setFullYear(end.getFullYear() + 2);
    const unsub = subscribeToBookings(start, end, (all: Booking[]) => {
      const sorted = all.sort(
        (a: Booking, b: Booking) => a.start.toDate() - b.start.toDate(),
      );
      setBookings(sorted);
    }, user.uid);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [user?.uid]);

async function handleLogout() {
  try {
    await signOut();
    router.replace("/auth");
  } catch (e) {
    console.error("Logout error", e);
  }
}

  async function handleChangeAvatar() {
    const user = getCurrentUser();
    if (!user?.uid) return;

    const localUri = await pickImageFromGallery();
    if (!localUri) return;

    const imageUrl = await uploadImage(
      localUri,
      `users/${user.uid}/avatar.jpg`,
    );

    await updateUserAvatar(user.uid, imageUrl);
  }


  async function saveField(field: "description") {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        [field]: description,
      });
      setEditingField(null);
    } catch (e) {
      console.error("Save field error", e);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <View style={[theme.screen, theme.center]}>
        <Text>Ładowanie profilu…</Text>
      </View>
    );
  }

  const fullName = `${profile.name} ${profile.surname}`;
  const firstLetter = profile.name?.charAt(0)?.toUpperCase() ?? "?";
  const isAdmin = mode === "admin";
  const canEditSelectedBooking =
    !!selectedBooking &&
    selectedBooking.status !== BookingStatus.Rejected &&
    (isAdmin || selectedBooking.userId === user?.uid);

  const isOwnSelectedBooking =
    !!selectedBooking && selectedBooking.userId === user?.uid;

  const notesMaxHeight =
    NOTE_VISIBLE_COUNT * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
    (NOTE_VISIBLE_COUNT - 1) * NOTE_ITEM_GAP;
  const notesContentHeight = Math.max(
    0,
    bookingNotes.length * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
      Math.max(0, bookingNotes.length - 1) * NOTE_ITEM_GAP,
  );
  const notesContainerHeight = Math.min(notesMaxHeight, notesContentHeight);

  return (
    <View style={[theme.screen, { paddingHorizontal: 16 }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Profil",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {profile.role === "admin" && (
                <Pressable
                  onPress={toggleMode}
                  style={headerStyles.adminButton}
                >
                  <Text style={headerStyles.adminButtonText}>
                    {mode === "admin" ? "User" : "Admin"}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => router.push("/(tabs)/profile/settings")}
                style={{ marginLeft: 12, padding: 4 }}
                accessibilityLabel="Ustawienia"
              >
                <Icon type="material" name="settings" size={26} color="#003366" />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={true}>
        {/* Avatar placeholder */}
        <View style={[theme.center, { marginBottom: 16 }]}>
          <Pressable style={{ marginTop: 8 }} onPress={handleChangeAvatar}>
            <View style={theme.avatar}>
              {profile.photoUrl ? (
                <Image
                  key={profile.photoUrl}
                  source={{ uri: profile.photoUrl }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 999,
                  }}
                />
              ) : (
                <Image
                  source={require("@/assets/images/user_placeholder.png")}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 999,
                  }}
                />
              )}
            </View>
            <Text style={[theme.link, { alignSelf: "center", marginTop: 10 }]}>
              Zmień zdjęcie
            </Text>
          </Pressable>
        </View>

        {/* Name & phone */}
        <Text style={theme.title}>{fullName}</Text>
        <Text style={theme.textSecondary}>{profile.phone}</Text>

        {/* Pseudonim */}
        {profile.pseudonim && (
          <View style={[theme.card, theme.cardPadding]}>
            <Text style={theme.sectionTitle}>Pseudonim</Text>
            <Text style={[theme.textPrimary]}>
              {profile.pseudonim}
            </Text>
          </View>
        )}

        {/* Description */}
        {/*
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.sectionTitle}>O mnie</Text>
          {editingField === 'description' ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[theme.input, { minHeight: 100 }]}
                placeholder="Wpisz opis"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <Pressable
                style={{ backgroundColor: theme.link.color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', opacity: saving ? 0.5 : 1 }}
                onPress={() => saveField('description')}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </Text>
              </Pressable>

        </View> */}

        {/* Bookings List */}
        <View
          style={[
            theme.card,
            theme.cardPadding,
            { marginTop: 16, marginBottom: 16 },
          ]}
        >
          <Text style={theme.title}>Twoje przyszłe rezerwacje</Text>
          {bookings.length === 0 ? (
            <Text style={theme.textMuted}>Brak nadchodzących rezerwacji</Text>
          ) : (
            <View>
              {bookings.map((b) => (
                <Pressable
                  key={b.id}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: "#eee",
                  }}
                  onPress={() => setSelectedBooking(b)}
                >
                  <Text style={theme.sectionTitle}>{getBookingYachtLabel(b)}</Text>
                  <Text style={theme.textSecondary}>
                    {b.start.toDate().toLocaleDateString()}{" "}
                    {b.start.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {b.end.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={theme.textXs}>
                    Status: {getBookingStatusLabel(b.status)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={{ width: "100%", marginTop: "auto" }}>
        <Pressable
          style={[theme.button, theme.buttonDanger]}
          onPress={handleLogout}
        >
          <Text style={theme.buttonDangerText}>Wyloguj się</Text>
        </Pressable>
      </View>

      <View style={{ marginVertical: 2, alignItems: "center" }}>
        <Pressable
          onPress={() => router.push("/(tabs)/profile/app-versioning")}
        >
          <Text
            style={[
              theme.versionText,
              { textDecorationLine: "underline", color: theme.link.color },
            ]}
          >
            Version {Constants.expoConfig?.version}
          </Text>
        </Pressable>
      </View>

      {/* Booking Modal (copied from calendar.tsx) */}
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
                        console.error("[PROFILE] note update error", error);
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
