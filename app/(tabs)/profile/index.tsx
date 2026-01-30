import { Booking } from "@/src/entities/booking";
import { subscribeToBookings } from "@/src/services/calendarService";
import { uploadImage } from "@/src/services/imageUploadService";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { pickImageFromGallery } from "@/src/utils/pickImage";
import { MaterialIcons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "../../../src/entities/user";
import {
  getUserPhotoUrl,
  subscribeToUser,
  updateUserProfile,
} from "../../../src/services/userService";
import { useMode } from "../../providers/ModeProvider";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingField, setEditingField] = useState<
    "pseudonim" | "description" | null
  >(null);
  const [description, setDescription] = useState("");
  const [pseudonim, setPseudonim] = useState("");
  const [saving, setSaving] = useState(false);
  const { mode, toggleMode } = useMode();
  const insets = useSafeAreaInsets();
  const user = auth().currentUser;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalUserPhoto, setModalUserPhoto] = useState<string | null>(null);
  
    useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);

  useEffect(() => {
    if (selectedBooking) {
      getUserPhotoUrl(selectedBooking.userId).then(setModalUserPhoto);
    } else {
      setModalUserPhoto(null);
    }
  }, [selectedBooking]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (data) => {
      setProfile(data);
      if (data) {
        setDescription(data.description || "");
        setPseudonim(data.pseudonim || "");
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
      // Only this user's bookings, only from today onwards
      const filtered = all
        .filter(
          (b: Booking) => b.userId === user.uid && b.start.toDate() >= start,
        )
        .sort((a: Booking, b: Booking) => a.start.toDate() - b.start.toDate());
      setBookings(filtered);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [user?.uid]);

  async function handleLogout() {
    try {
      await auth().signOut();
      router.replace("/auth");
    } catch (e) {
      console.error("Logout error", e);
    }
  }

  async function handleChangeAvatar() {
    if (!user?.uid) return;

    const localUri = await pickImageFromGallery();
    if (!localUri) return;

    const imageUrl = await uploadImage(
      localUri,
      `users/${user.uid}/avatar.jpg`,
    );

    await firestore()
      .collection("users")
      .doc(user.uid)
      .update({ photoUrl: imageUrl });
  }

  async function saveField(field: "pseudonim" | "description") {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        [field]: field === "pseudonim" ? pseudonim : description,
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
                <MaterialIcons name="settings" size={26} color="#003366" />
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
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.sectionTitle}>Pseudonim</Text>
          {editingField === "pseudonim" ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={pseudonim}
                onChangeText={setPseudonim}
                style={theme.input}
                placeholder="Wpisz pseudonim"
                autoFocus
              />
              <Pressable
                style={{
                  backgroundColor: theme.link.color,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                  alignSelf: "flex-start",
                  opacity: saving ? 0.5 : 1,
                }}
                onPress={() => saveField("pseudonim")}
                disabled={saving}
              >
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
                >
                  {saving ? "Zapisywanie..." : "Zapisz"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onPress={() => setEditingField("pseudonim")}
            >
              <Text style={[theme.textPrimary, { flex: 1 }]}>
                {pseudonim || "Brak pseudonimu"}
              </Text>
              <MaterialIcons
                name="edit"
                size={18}
                color={theme.link.color}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          )}
        </View>

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
                  <Text style={theme.sectionTitle}>{b.yachtName}</Text>
                  <Text style={theme.textSecondary}>
                    {b.start.toDate().toLocaleDateString()}{" "}
                    {b.start
                      .toDate()
                      .toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    {" - "}
                    {b.end
                      .toDate()
                      .toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </Text>
                  <Text style={theme.textXs}>Status: {b.status}</Text>
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
        <View style={theme.modalOverlay}>
          <View style={theme.modal}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={theme.title}>{selectedBooking.yachtName}</Text>
              {isAdmin && (
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
                  <MaterialIcons
                    name="edit"
                    size={24}
                    color={theme.link.color}
                  />
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
            <Text style={theme.textPrimary}>
              ⏰{" "}
              {selectedBooking.start
                .toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {selectedBooking.end
                .toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={theme.textPrimary}>
              {"Status: "}
              {selectedBooking.status}
            </Text>
            <Pressable
              style={{ marginTop: 16, alignSelf: "flex-end" }}
              onPress={() => setSelectedBooking(null)}
            >
              <Text style={theme.link}>Zamknij</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
