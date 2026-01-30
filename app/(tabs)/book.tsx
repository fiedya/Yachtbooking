import { Yacht } from "@/src/entities/yacht";
import { createBooking } from "@/src/services/booking.service";
import { getAvailableYachtIds } from "@/src/services/calendarService";
import { getUser, subscribeToUser } from "@/src/services/userService";
import { getActiveYachts } from "@/src/services/yachtService";
import { headerStyles } from "@/src/theme/header";
import { styles } from "@/src/theme/styles";
import DateTimePicker from "@react-native-community/datetimepicker";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMode } from "../providers/ModeProvider";

export default function BookScreen() {
  const user = auth().currentUser;
  const router = useRouter();
  const {
    startDate: paramStartDate,
    endDate: paramEndDate,
    bookingId,
    edit,
  } = useLocalSearchParams<{
    startDate?: string;
    endDate?: string;
    bookingId?: string;
    edit?: string;
  }>();
  const { mode: adminMode } = useMode();
  // Initialize dates from params if provided, otherwise use now
  // Helper to extract date and time from ISO string
  const getDatePart = (iso?: string) => (iso ? new Date(iso) : new Date());
  const getTimePart = (iso?: string) => (iso ? new Date(iso) : new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // If params provided, use them to prefill fields
  const [date, setDate] = useState(() => getDatePart(paramStartDate));
  const [startTime, setStartTime] = useState(() => getTimePart(paramStartDate));
  const [endTime, setEndTime] = useState(() => getTimePart(paramEndDate));

  const [loading, setLoading] = useState(false);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [availableYachtIds, setAvailableYachtIds] = useState<string[]>([]);
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<{ usePseudonims: boolean }>({
    usePseudonims: false,
  });
  const [editingBooking, setEditingBooking] = useState<any>(null);

  // Update fields if navigation params change (e.g., user clicks a new slot)
  useEffect(() => {
    if (paramStartDate) {
      const d = new Date(paramStartDate);
      setDate(d);
      setStartTime(d);
    }
    if (paramEndDate) {
      setEndTime(new Date(paramEndDate));
    }
  }, [paramStartDate, paramEndDate]);

  useEffect(() => {
    if (edit && bookingId && adminMode === "admin") {
      firestore()
        .collection("bookings")
        .doc(bookingId)
        .get()
        .then((doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (!data) return;
            setEditingBooking({ ...data, id: doc.id });
            // Pre-fill form fields
            setBookingName(data.userName || "");
            if (data.start && typeof data.start.toDate === "function") {
              setDate(data.start.toDate());
              setStartTime(data.start.toDate());
            }
            if (data.end && typeof data.end.toDate === "function") {
              setEndTime(data.end.toDate());
            }
            if (data.yachtId && data.yachtName) {
              setYacht({
                id: data.yachtId,
                name: data.yachtName,
                // fallback for imageUrl, etc. will be handled by yacht list
              } as Yacht);
            }
          }
        });
    }
  }, [edit, bookingId, adminMode]);
  // Subscribe to user preferences in user doc
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (data) => {
      const prefs = data?.preferences ?? {
        usePseudonims: false,
        useYachtShortcuts: false,
      };
      setSettings({ usePseudonims: prefs.usePseudonims ?? false });
    });
    return unsub;
  }, [user?.uid]);

  async function handleBook() {
    if (!user) return;

    const start = new Date(date);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (end <= start) {
      Alert.alert("Błąd", "Godzina zakończenia musi być późniejsza");
      return;
    }

    if (!yacht) {
      Alert.alert("Błąd", "Nie wybrano jachtu");
      return;
    }

    setLoading(true);

    try {
      const profile = await getUser(user.uid);
      let fullName = "";

      if (adminMode === "admin" && bookingName.trim()) {
        fullName = bookingName.trim();
      } else if (profile) {
        if (settings.usePseudonims && profile.pseudonim) {
          fullName = profile.pseudonim;
        } else {
          fullName = `${profile.name} ${profile.surname}`;
        }
      } else {
        fullName = user.phoneNumber || "";
      }

      if (edit && bookingId && adminMode === "admin") {
        // Update existing booking
        await firestore().collection("bookings").doc(bookingId).update({
          userName: fullName,
          yachtId: yacht.id,
          yachtName: yacht.name,
          start,
          end,
        });
        Alert.alert("Sukces", "Rezerwacja została zaktualizowana");
      } else {
        // New booking
        await createBooking({
          userId: user.uid,
          userName: fullName,
          yachtId: yacht.id,
          yachtName: yacht.name,
          start,
          end,
        });
        Alert.alert("Sukces", "Rezerwacja została zapisana");
      }
      router.replace("/(tabs)/calendar");
    } catch (e) {
      console.error("[BOOKING ERROR]", e);
      Alert.alert("Błąd", "Nie udało się zapisać rezerwacji");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    getUser(user.uid).then((profile) => {
      if (profile?.role === "admin") {
        setIsAdmin(true);
      }
    });
  }, [user?.uid]);

  useEffect(() => {
    getActiveYachts().then((data) => {
      setYachts(data);
      if (data.length > 0) {
        setYacht(data[0]); // default selection
      }
    });
  }, [edit, bookingId]);

  useEffect(() => {
    const start = new Date(date);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (end > start) {
      const editingId = edit && bookingId ? bookingId : undefined;
      getAvailableYachtIds(start, end, editingId).then((busyIds) => {
        setAvailableYachtIds(busyIds);
        // If current yacht becomes unavailable, select another one
        if (yacht && busyIds.includes(yacht.id)) {
          const availableYacht = yachts.find((y) => !busyIds.includes(y.id));
          setYacht(availableYacht || null);
        }
      });
    }
  }, [date, startTime, endTime, yachts, yacht]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Nowa rezerwacja",
            headerStyle: headerStyles.header,
            headerTitleStyle: headerStyles.title,
          }}
        />
        {adminMode === "admin" && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Osoba rezerwująca</Text>
            <TextInput
              value={bookingName}
              onChangeText={setBookingName}
              placeholder="Imię i nazwisko"
              style={styles.pickerButton}
            />
          </View>
        )}
        {/* Date */}
        <Text style={styles.label}>Data</Text>
        <Pressable
          style={styles.pickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{date.toLocaleDateString()}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}
        {/* Start */}
        <Text style={styles.label}>Od</Text>
        <Pressable
          style={styles.pickerButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Text>
            {startTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) setStartTime(selectedDate);
            }}
          />
        )}
        {/* End */}
        <Text style={styles.label}>Do</Text>
        <Pressable
          style={styles.pickerButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Text>
            {endTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>
        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) setEndTime(selectedDate);
            }}
          />
        )}
        <Text style={styles.label}>Jacht</Text>
        <View style={{ marginTop: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {yachts.map((y) => {
              const selected = yacht?.id === y.id;
              const isAvailable = !availableYachtIds.includes(y.id);
              return (
                <Pressable
                  key={y.id}
                  onPress={() => isAvailable && setYacht(y)}
                  disabled={!isAvailable}
                  style={[
                    styles.yachtCard,
                    selected && styles.yachtCardActive,
                    !isAvailable && styles.yachtCardDisabled,
                  ]}
                >
                  <Image
                    source={
                      y.imageUrl
                        ? { uri: y.imageUrl }
                        : require("@/assets/images/yacht_placeholder.png")
                    }
                    style={[
                      styles.yachtImage,
                      !isAvailable && { opacity: 0.5 },
                    ]}
                    resizeMode="cover"
                  />
                  <Text
                    style={[
                      styles.yachtName,
                      selected && styles.yachtNameActive,
                      !isAvailable && { color: "#999" },
                    ]}
                    numberOfLines={1}
                  >
                    {y.name}
                  </Text>
                  {!isAvailable && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#cc0000",
                        marginTop: 4,
                        marginLeft: 8,
                        marginBottom: 5,
                      }}
                    >
                      Zajęty
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          {yachts.length === 0 && (
            <Text style={{ color: "#999", marginTop: 8 }}>
              Brak dostępnych jachtów
            </Text>
          )}
        </View>
      </ScrollView>
      {/* Submit */}
      <Pressable
        style={[styles.submit, loading && styles.submitDisabled]}
        onPress={handleBook}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? "Zapisywanie…" : "Zarezerwuj"}
        </Text>
      </Pressable>
    </View>
  );
}
