import WebDatePicker from "@/src/components/WebDatePicker";
import { BookingStatus } from "@/src/entities/booking";
import { Yacht } from "@/src/entities/yacht";
import { getDoc, updateDoc } from "@/src/firebase/init";
import { useAuth } from "@/src/providers/AuthProvider";
import { createBooking } from "@/src/services/booking.service";
import { getAvailableYachtIds } from "@/src/services/calendarService";
import { getUser, subscribeToUser } from "@/src/services/userService";
import { getAvailableYachts } from "@/src/services/yachtService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles } from "@/src/theme/styles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useIsFocused } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useMode } from "../../src/providers/ModeProvider";

export default function BookScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();
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
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const getDatePart = (iso?: string) => (iso ? new Date(iso) : new Date());
  const getTimePart = (iso?: string) => (iso ? new Date(iso) : new Date());
  const getDefaultEndTime = (startIso?: string, endIso?: string) => {
    if (endIso) return new Date(endIso);

    const base = startIso ? new Date(startIso) : new Date();
    const end = new Date(base);
    end.setHours(base.getHours() + 1, base.getMinutes(), 0, 0);
    return end;
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [date, setDate] = useState(() => getDatePart(paramStartDate));
  const [startTime, setStartTime] = useState(() => getTimePart(paramStartDate));
  const [endTime, setEndTime] = useState(() =>
    getDefaultEndTime(paramStartDate, paramEndDate),
  );

  const [loading, setLoading] = useState(false);
  const [validatingAvailability, setValidatingAvailability] = useState(false);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [availableYachtIds, setAvailableYachtIds] = useState<string[]>([]);
  const [selectedYachts, setSelectedYachts] = useState<Yacht[]>([]);
  const [bookingName, setBookingName] = useState("");
  const [settings, setSettings] = useState<{ usePseudonims: boolean }>({
    usePseudonims: false,
  });
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const availabilityRequestIdRef = useRef(0);
  const now = new Date();

  useEffect(() => {
    if (paramStartDate) {
      const d = new Date(paramStartDate);
      setDate(d);
      setStartTime(d);

      if (!paramEndDate) {
        const defaultEnd = new Date(d);
        defaultEnd.setHours(d.getHours() + 1, d.getMinutes(), 0, 0);
        setEndTime(defaultEnd);
      }
    }
    if (paramEndDate) {
      setEndTime(new Date(paramEndDate));
    }
  }, [paramStartDate, paramEndDate]);

  useEffect(() => {
    if (!edit || !bookingId || !user) return;

    getDoc("bookings", bookingId).then((snap: any) => {
      if (!snap.exists()) return;

      const data = snap.data();
      if (!data) return;

      const isOwner = data.userId === user.uid;
      if (!isAdmin && !isOwner) {
        Alert.alert("Brak dostępu", "Nie możesz edytować tej rezerwacji");
        router.replace("/(tabs)/calendar");
        return;
      }

      if (
        data.status === BookingStatus.Rejected ||
        data.status === BookingStatus.Cancelled
      ) {
        Alert.alert("Brak dostępu", "Nie można edytować odrzuconej lub odwołanej rezerwacji");
        router.replace("/(tabs)/calendar");
        return;
      }

      setEditingBooking({ ...data, id: snap.id });

      setBookingName(data.userName || "");

      if (data.start && typeof data.start.toDate === "function") {
        const startDate = data.start.toDate();
        setDate(startDate);
        setStartTime(startDate);
      }

      if (data.end && typeof data.end.toDate === "function") {
        setEndTime(data.end.toDate());
      }

      const yachtIds = data.yachtIds ?? (data.yachtId ? [data.yachtId] : []);
      const yachtNames = data.yachtNames ?? (data.yachtName ? [data.yachtName] : []);
      if (yachtIds.length > 0) {
        setSelectedYachts(
          yachtIds.map((id: string, index: number) => ({
            id,
            name: yachtNames[index] ?? yachtNames[0] ?? "",
          })) as Yacht[],
        );
      }
    });
  }, [edit, bookingId, isAdmin, user, router]);


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

    if (selectedYachts.length === 0) {
      Alert.alert("Błąd", "Nie wybrano jachtu");
      return;
    }

    const editingId = edit && bookingId ? bookingId : undefined;
    const busyIdsAtSave = await getAvailableYachtIds(start, end, editingId);
    const stillAvailableYachts = selectedYachts.filter(
      (yacht) => !busyIdsAtSave.includes(yacht.id),
    );

    if (stillAvailableYachts.length !== selectedYachts.length) {
      setAvailableYachtIds(busyIdsAtSave);
      setSelectedYachts(stillAvailableYachts);
      Alert.alert(
        "Błąd",
        "Wybrany jacht jest już zajęty w tym terminie. Wybierz inny jacht.",
      );
      return;
    }

    setLoading(true);

    try {
      const profile = await getUser(user.uid);
      let fullName = "";

      if (isAdmin && bookingName.trim()) {
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

      if (edit && bookingId) {
        if (
          editingBooking?.status === BookingStatus.Rejected ||
          editingBooking?.status === BookingStatus.Cancelled
        ) {
          Alert.alert("Błąd", "Nie można edytować odrzuconej lub odwołanej rezerwacji");
          return;
        }

        await updateDoc("bookings", bookingId, {
          userName: fullName,
          yachtIds: stillAvailableYachts.map((y) => y.id),
          yachtNames: stillAvailableYachts.map((y) => y.name),
          start,
          end,
          status: BookingStatus.Pending,
        });

        Alert.alert("Sukces", "Rezerwacja została zaktualizowana");
      } else {
        // New booking
        await createBooking({
          userId: user.uid,
          userName: fullName,
          yachtIds: stillAvailableYachts.map((y) => y.id),
          yachtNames: stillAvailableYachts.map((y) => y.name),
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
    getAvailableYachts().then((data) => {
      setYachts(data);
    });
  }, [edit, bookingId]);

  useEffect(() => {
    if (!isFocused) {
      setValidatingAvailability(false);
      return;
    }

    const start = new Date(date);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (end > start) {
      const requestId = ++availabilityRequestIdRef.current;
      setValidatingAvailability(true);
      const editingId = edit && bookingId ? bookingId : undefined;
      getAvailableYachtIds(start, end, editingId).then((busyIds) => {
        if (requestId !== availabilityRequestIdRef.current) {
          return;
        }

        setAvailableYachtIds(busyIds);

        setSelectedYachts((prev) => prev.filter((y) => !busyIds.includes(y.id)));
      }).finally(() => {
        if (requestId === availabilityRequestIdRef.current) {
          setValidatingAvailability(false);
        }
      });
    } else {
      setAvailableYachtIds([]);
      setValidatingAvailability(false);
    }
  }, [isFocused, date, startTime, endTime, yachts, edit, bookingId]);

  const isDateRangeValid = useMemo(() => {
    const start = new Date(date);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    return end > start;
  }, [date, startTime, endTime]);

  const canSubmit =
    !loading &&
    !validatingAvailability &&
    isDateRangeValid &&
    selectedYachts.length > 0;

  const snapToQuarter = (date: Date) => {
    const snapped = Math.round(date.getMinutes() / 15) * 15;

    const fixed = new Date(date);
    fixed.setMinutes(snapped);
    fixed.setSeconds(0);
    fixed.setMilliseconds(0);

    return fixed;
  };

  const isWeb = Platform.OS === "web";
  const orderedYachts = useMemo(() => {
    const busyIds = new Set(availableYachtIds);
    return [...yachts].sort((a, b) => {
      const aBusy = busyIds.has(a.id) ? 1 : 0;
      const bBusy = busyIds.has(b.id) ? 1 : 0;
      return aBusy - bBusy;
    });
  }, [yachts, availableYachtIds]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Nowa rezerwacja",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />
      <ScrollView>
        {isAdmin && (
        <View>
          <Text style={styles.label}>Osoba rezerwująca</Text>
          <TextInput
            value={bookingName}
            onChangeText={setBookingName}
            placeholder="Imię i nazwisko"
            style={[styles.pickerButton, styles.inputDefaultText]}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}
      <Text style={styles.label}>Data</Text>
      {isWeb ? (
        <WebDatePicker
          mode="date"
          value={date}
          onChange={(selectedDate) => {
            const selectedDateOnly = new Date(selectedDate);
            selectedDateOnly.setHours(0, 0, 0, 0);
            const todayOnly = new Date(now);
            todayOnly.setHours(0, 0, 0, 0);
            if (!isAdmin && selectedDateOnly < todayOnly) {
              Alert.alert("Błąd", "Nie można wybrać przeszłej daty");
              return;
            }
            setDate(selectedDate);
          }}
          placeholder="YYYY-MM-DD"
          minDate={isAdmin ? undefined : now}
        />
      ) : (
        <>
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
              minimumDate={isAdmin ? undefined : now}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  const selectedDateOnly = new Date(selectedDate);
                  selectedDateOnly.setHours(0, 0, 0, 0);
                  const todayOnly = new Date(now);
                  todayOnly.setHours(0, 0, 0, 0);
                  if (!isAdmin && selectedDateOnly < todayOnly) {
                    Alert.alert("Błąd", "Nie można wybrać przeszłej daty");
                    return;
                  }
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </>
      )}
      <Text style={styles.label}>Od</Text>
      {isWeb ? (
        <WebDatePicker
          mode="time"
          value={startTime}
          onChange={(value: Date) => setStartTime(snapToQuarter(value))}
          placeholder="HH:MM"
        />
      ) : (
        <>
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
              display={Platform.OS === "android" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (event.type === "dismissed") {
                  setShowStartPicker(false);
                  return;
                }

                if (selectedDate) {
                  const snapped = snapToQuarter(selectedDate);
                  setStartTime(snapped);
                }

                if (Platform.OS === "android") {
                  setShowStartPicker(false);
                }
              }}
            />
          )}
        </>
      )}
      <Text style={styles.label}>Do</Text>
      {isWeb ? (
        <WebDatePicker
          mode="time"
          value={endTime}
          onChange={(value: Date) => setEndTime(snapToQuarter(value))}
          placeholder="HH:MM"
        />
      ) : (
        <>
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
              display={Platform.OS === "android" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (event.type === "dismissed") {
                  setShowEndPicker(false);
                  return;
                }

                if (selectedDate) {
                  const snapped = snapToQuarter(selectedDate);
                  setEndTime(snapped);
                }

                if (Platform.OS === "android") {
                  setShowEndPicker(false);
                }
              }}
            />
          )}
        </>
      )}
      <Text style={styles.label}>Jacht</Text>
      <View style={{ marginTop: 8 }}>
        {orderedYachts.length === 0 ? (
          <Text style={{ color: "#999", marginTop: 8 }}>Brak dostępnych jachtów</Text>
        ) : (
          <FlatList
            data={orderedYachts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={true}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item: y }) => {
              const selected = selectedYachts.some((item) => item.id === y.id);
              const isAvailable = !availableYachtIds.includes(y.id);
              return (
                <Pressable
                  onPress={() => {
                    if (!isAvailable) return;
                    setSelectedYachts((prev) => {
                      const exists = prev.some((item) => item.id === y.id);
                      
                      if (isAdmin) {
                        // Admin: toggle multi-select
                        if (exists) {
                          return prev.filter((item) => item.id !== y.id);
                        }
                        return [...prev, y];
                      } else {
                        // Non-admin: single selection (radio-button)
                        if (exists) {
                          return prev.filter((item) => item.id !== y.id);
                        }
                        return [y];
                      }
                    });
                  }}
                  disabled={!isAvailable}
                  style={[
                    styles.yachtCard,
                    { width: "48%", marginRight: 0, marginBottom: 12 },
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
                    style={[styles.yachtImage, !isAvailable && { opacity: 0.5 }]}
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
            }}
          />
        )}
      </View>
      </ScrollView>
      {/* Submit */}
      <Pressable
        style={[styles.submit, { marginTop: 10 }, !canSubmit && styles.submitDisabled]}
        onPress={handleBook}
        disabled={!canSubmit}
      >
        <Text style={styles.submitText}>
          {loading
            ? "Zapisywanie…"
            : validatingAvailability
              ? "Sprawdzanie dostępności…"
              : "Zarezerwuj"}
        </Text>
      </Pressable>
    </View>
  );
}
