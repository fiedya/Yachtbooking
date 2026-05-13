import Icon from "@/src/components/Icon";
import { Booking, BookingStatus } from "@/src/entities/booking";
import { Note } from "@/src/entities/note";
import { getCurrentUser, signOut } from "@/src/firebase/init";
import { getBookingStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { updateBookingStatus } from "@/src/services/booking.service";
import { subscribeToUserAllBookings } from "@/src/services/calendarService";
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
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { User } from "../../../src/entities/user";
import { useMode } from "../../../src/providers/ModeProvider";
import {
  getUserPhotoUrl,
  subscribeToUser,
  updateUserAvatar,
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

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const label = getBookingStatusLabel(status);
  let bg = colors.lightGrey;
  let fg = colors.textSecondary;
  if (status === BookingStatus.Approved) { bg = colors.secondary; fg = colors.white; }
  if (status === BookingStatus.Rejected || status === BookingStatus.Cancelled) {
    bg = colors.dangerSoft; fg = colors.danger;
  }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: fg }}>{label}</Text>
    </View>
  );
}

function BookingListItem({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const yachtNames = (booking as any)?.yachtNames ?? ((booking as any)?.yachtName ? [(booking as any).yachtName] : []);
  const label = yachtNames.join(", ") || "Rezerwacja";
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[theme.textPrimary, { fontWeight: "600", marginBottom: 2 }]}>{label}</Text>
        <Text style={theme.textSecondary}>
          {booking.start.toDate().toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "short" })}
        </Text>
        <Text style={theme.textSecondary}>
          {booking.start.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {booking.end.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      <BookingStatusBadge status={booking.status} />
      <Icon name="chevron-forward-outline" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
      <Text style={theme.textSecondary}>{label}</Text>
      <Text style={[theme.textPrimary, { fontWeight: "500" }]}>{value}</Text>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.backgroundSoft,
      borderRadius: 10,
      padding: 6,
      alignItems: "center",
      borderTopWidth: 3,
      borderTopColor: color,
    }}>
      <Text style={{ fontSize: 20, fontWeight: "600", color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const { mode, toggleMode } = useMode();
  const { user, uid, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rejectedBookings, setRejectedBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showAdminRejectInput, setShowAdminRejectInput] = useState(false);
  const [adminRejectReason, setAdminRejectReason] = useState("");
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
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date();
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 2);
    const unsub = subscribeToUserAllBookings(user.uid, rangeStart, rangeEnd, (all: Booking[]) => {
      const sorted = [...all].sort((a: Booking, b: Booking) => a.start.toDate() - b.start.toDate());
      setBookings(sorted.filter((b) => b.status === BookingStatus.Pending || b.status === BookingStatus.Approved));
      setRejectedBookings(sorted.filter((b) => b.status === BookingStatus.Rejected || b.status === BookingStatus.Cancelled));
    });
    return () => { if (typeof unsub === "function") unsub(); };
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
    const imageUrl = await uploadImage(localUri, `users/${user.uid}/avatar.jpg`);
    await updateUserAvatar(user.uid, imageUrl);
  }

  if (!profile) {
    return (
      <View style={[theme.screen, theme.center]}>
        <Text>Ładowanie profilu…</Text>
      </View>
    );
  }

  const isAdmin = mode === "admin";
  const canEditSelectedBooking =
    !!selectedBooking &&
    selectedBooking.status !== BookingStatus.Rejected &&
    (isAdmin || selectedBooking.userId === user?.uid);
  const isOwnSelectedBooking = !!selectedBooking && selectedBooking.userId === user?.uid;

  const notesMaxHeight =
    NOTE_VISIBLE_COUNT * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
    (NOTE_VISIBLE_COUNT - 1) * NOTE_ITEM_GAP;
  const notesContentHeight = Math.max(
    0,
    bookingNotes.length * (NOTE_LINE_HEIGHT + NOTE_VERTICAL_PADDING * 2) +
      Math.max(0, bookingNotes.length - 1) * NOTE_ITEM_GAP,
  );
  const notesContainerHeight = Math.min(notesMaxHeight, notesContentHeight);

  const approvedCount = bookings.filter((b) => b.status === BookingStatus.Approved).length;
  const pendingCount = bookings.filter((b) => b.status === BookingStatus.Pending).length;
  const totalCount = bookings.length + rejectedBookings.length;

  return (
    <View style={theme.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Profil",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {profile.role === "admin" && (
                <Pressable onPress={toggleMode} style={headerStyles.adminButton}>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 48 }}
      >
        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Pressable onPress={handleChangeAvatar} style={{ position: "relative" }}>
            {profile.photoUrl ? (
              <Image
                key={profile.photoUrl}
                source={{ uri: profile.photoUrl }}
                style={{ width: 104, height: 104, borderRadius: 52 }}
              />
            ) : (
              <Image
                source={require("@/assets/images/user_placeholder.png")}
                style={{ width: 104, height: 104, borderRadius: 52 }}
              />
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: colors.primary,
                borderRadius: 14,
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.white,
              }}
            >
              <Icon name="camera-outline" size={14} color={colors.white} />
            </View>
          </Pressable>
          <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
            Dotknij, aby zmienić zdjęcie
          </Text>
        </View>

        {/* User info */}
        <View style={{ backgroundColor: colors.backgroundSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 }}>
          <InfoRow label="Imię" value={profile.name} />
          <InfoRow label="Nazwisko" value={profile.surname} />
          {!!profile.phone && <InfoRow label="Telefon" value={profile.phone} />}
          {!!profile.pseudonim && <InfoRow label="Pseudonim" value={profile.pseudonim} />}
          <InfoRow label="Rola" value={isAdmin ? "Administrator" : "Użytkownik"} />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <StatCard label="Wszystkie" value={totalCount} color={colors.primary} />
          <StatCard label="Zatwierdzone" value={approvedCount} color={colors.secondary} />
          <StatCard label="Oczekujące" value={pendingCount} color={colors.primaryLight} />
        </View>

        {/* Upcoming bookings */}
        <Text style={theme.sectionTitle}>Nadchodzące rezerwacje</Text>
        {bookings.length === 0 ? (
          <Text style={[theme.textMuted, { marginBottom: 20, paddingVertical: 8 }]}>
            Brak nadchodzących rezerwacji
          </Text>
        ) : (
          <View style={{ marginBottom: 10 }}>
            {bookings.map((b) => (
              <BookingListItem key={b.id} booking={b} onPress={() => setSelectedBooking(b)} />
            ))}
          </View>
        )}

        {/* Rejected / Cancelled */}
        {rejectedBookings.length > 0 && (
          <>
            <Text style={theme.sectionTitle}>Odrzucone i anulowane</Text>
            <View style={{ marginBottom: 20 }}>
              {rejectedBookings.map((b) => (
                <BookingListItem key={b.id} booking={b} onPress={() => setSelectedBooking(b)} />
              ))}
            </View>
          </>
        )}

        <Pressable
          style={[theme.button, { marginTop: 8 }]}
          onPress={() => router.push("/(tabs)/book")}
        >
          <Text style={theme.buttonText}>+ Nowa rezerwacja</Text>
        </Pressable>
      </ScrollView>

      {/* Logout & version */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Pressable style={[theme.button, theme.buttonDanger]} onPress={handleLogout}>
          <Text style={theme.buttonDangerText}>Wyloguj się</Text>
        </Pressable>
      </View>
      <View style={{ marginVertical: 4, alignItems: "center" }}>
        <Pressable onPress={() => router.push("/(tabs)/profile/app-versioning")}>
          <Text style={[theme.versionText, { textDecorationLine: "underline", color: theme.link.color }]}>
            Version {Constants.expoConfig?.version}
          </Text>
        </Pressable>
      </View>

      {/* Booking Modal */}
      {selectedBooking && (
        <Pressable
          style={theme.modalOverlay}
          onPress={() => {
            setSelectedBooking(null);
            setShowNoteEditor(false);
            setShowAdminRejectInput(false);
          }}
        >
          <Pressable style={theme.modal} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={theme.title}>{getBookingYachtLabel(selectedBooking)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {isAdmin && (
                  <Pressable
                    onPress={() => {
                      setSelectedBooking(null);
                      router.push({
                        pathname: "/(tabs)/book",
                        params: { copyBookingId: selectedBooking.id },
                      });
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
                      router.push({
                        pathname: "/(tabs)/book",
                        params: { bookingId: selectedBooking.id, edit: "1" },
                      });
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
              <Text style={theme.textPrimary}>{selectedBooking.userName}</Text>
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
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.danger,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 11, fontWeight: "700" }}>?</Text>
                </Pressable>
              ) : null}
            </View>

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

            {isAdmin && selectedBooking && (
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
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
