import WebDatePicker from "@/src/components/WebDatePicker";
import { BookingStatus } from "@/src/entities/booking";
import { Yacht } from "@/src/entities/yacht";
import { getDoc, updateDoc } from "@/src/firebase/init";
import { useAuth } from "@/src/providers/AuthProvider";
import { useCalendarMode } from "@/src/providers/CalendarModeProvider";
import { createBooking } from "@/src/services/booking.service";
import { getAvailableYachtIds } from "@/src/services/calendarService";
import { checkDutyCoverage, createDuty, getDuty, updateDuty } from "@/src/services/dutyService";
import { getUser, subscribeToUser } from "@/src/services/userService";
import { getAvailableYachts, getYachts } from "@/src/services/yachtService";
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
    copyBookingId,
    dutyId,
  } = useLocalSearchParams<{
    startDate?: string;
    endDate?: string;
    bookingId?: string;
    edit?: string;
    copyBookingId?: string;
    dutyId?: string;
  }>();
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const { calendarMode, dutyOfficers } = useCalendarMode();
  const isEditingDuty = isAdmin && !!dutyId && edit === "1";
  const isDutyMode = (calendarMode === "duties" && isAdmin && !edit && !copyBookingId) || isEditingDuty;

  const getDatePart = (iso?: string) => (iso ? new Date(iso) : new Date());
  const getTimePart = (iso?: string) => (iso ? new Date(iso) : new Date());
  const getDefaultEndTime = (startIso?: string, endIso?: string) => {
    if (endIso) return new Date(endIso);
    const base = startIso ? new Date(startIso) : new Date();
    const end = new Date(base);
    end.setHours(base.getHours() + 1, base.getMinutes(), 0, 0);
    return end;
  };

  // ─── Booking form state ───────────────────────────────────────────────────
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

  // Duty coverage check
  const [hasDutyOfficer, setHasDutyOfficer] = useState<boolean | null>(null);
  const dutyCheckRequestIdRef = useRef(0);

  // ─── Duty form state ──────────────────────────────────────────────────────
  const [dutyOfficerName, setDutyOfficerName] = useState("");
  const [dutyOfficerPhone, setDutyOfficerPhone] = useState("");
  const [dutyStartDate, setDutyStartDate] = useState(() => new Date());
  const [dutyStartTime, setDutyStartTime] = useState(() => new Date());
  const [dutyEndDate, setDutyEndDate] = useState(() => new Date());
  const [dutyEndTime, setDutyEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 8, 0, 0, 0);
    return d;
  });
  const [dutySubmitting, setDutySubmitting] = useState(false);
  const [showDutyStartDatePicker, setShowDutyStartDatePicker] = useState(false);
  const [showDutyStartTimePicker, setShowDutyStartTimePicker] = useState(false);
  const [showDutyEndDatePicker, setShowDutyEndDatePicker] = useState(false);
  const [showDutyEndTimePicker, setShowDutyEndTimePicker] = useState(false);
  const [officerSuggestionsVisible, setOfficerSuggestionsVisible] = useState(false);

  const now = new Date();
  const isWeb = Platform.OS === "web";

  // ─── Duty form: autocomplete ──────────────────────────────────────────────
  const officerSuggestions = useMemo(() => {
    if (!dutyOfficerName.trim()) return [];
    return dutyOfficers.filter((o) =>
      o.name.toLowerCase().includes(dutyOfficerName.toLowerCase()),
    );
  }, [dutyOfficerName, dutyOfficers]);

  // ─── Booking form: param init ─────────────────────────────────────────────
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

  // ─── Duty form: reset and pre-fill from params on every focus (new duty only)
  useEffect(() => {
    if (!isFocused || !isDutyMode || isEditingDuty) return;
    setDutyOfficerName("");
    setDutyOfficerPhone("");
    setOfficerSuggestionsVisible(false);
    const now = new Date();
    if (paramStartDate) {
      const d = new Date(paramStartDate);
      setDutyStartDate(d);
      setDutyStartTime(d);
    } else {
      setDutyStartDate(now);
      setDutyStartTime(now);
    }
    if (paramEndDate) {
      const d = new Date(paramEndDate);
      setDutyEndDate(d);
      setDutyEndTime(d);
    } else {
      const defaultEnd = new Date(now);
      defaultEnd.setHours(now.getHours() + 8, 0, 0, 0);
      setDutyEndDate(defaultEnd);
      setDutyEndTime(defaultEnd);
    }
  }, [isFocused, isDutyMode, isEditingDuty, paramStartDate, paramEndDate]);

  // ─── Duty form: load existing duty data when editing ─────────────────────
  useEffect(() => {
    if (!isEditingDuty || !dutyId) return;
    getDuty(dutyId).then((duty) => {
      if (!duty) return;
      setDutyOfficerName(duty.dutyOfficerName);
      setDutyOfficerPhone(duty.dutyOfficerPhone);
      const s = duty.start?.toDate?.();
      const e = duty.end?.toDate?.();
      if (s) { setDutyStartDate(s); setDutyStartTime(s); }
      if (e) { setDutyEndDate(e); setDutyEndTime(e); }
    });
  }, [dutyId, isEditingDuty]);

  useEffect(() => {
    if (!edit || !bookingId || !user) {
      setEditingBooking(null);
      setSelectedYachts([]);
      setBookingName("");
      if (!paramStartDate) {
        const now = new Date();
        setDate(now);
        setStartTime(now);
        const defaultEnd = new Date(now);
        defaultEnd.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
        setEndTime(defaultEnd);
      }
      return;
    }

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
  }, [edit, bookingId, isAdmin, user, router, paramStartDate]);

  useEffect(() => {
    if (!copyBookingId) return;

    getDoc("bookings", copyBookingId).then((snap: any) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (!data) return;

      if (data.start && typeof data.start.toDate === "function") {
        const startDate = data.start.toDate();
        setDate(startDate);
        setStartTime(startDate);
      }
      if (data.end && typeof data.end.toDate === "function") {
        setEndTime(data.end.toDate());
      }

      const yachtIds: string[] = data.yachtIds ?? (data.yachtId ? [data.yachtId] : []);
      const yachtNames: string[] = data.yachtNames ?? (data.yachtName ? [data.yachtName] : []);
      if (yachtIds.length > 0) {
        setSelectedYachts(
          yachtIds.map((id, index) => ({
            id,
            name: yachtNames[index] ?? yachtNames[0] ?? "",
          })) as Yacht[],
        );
      }
    });
  }, [copyBookingId]);

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

  // ─── Duty coverage check for booking form ────────────────────────────────
  useEffect(() => {
    if (isDutyMode) return;

    const start = new Date(date);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const end = new Date(date);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    // Invalid range — keep previous state so warning doesn't flicker
    if (end <= start) return;

    const requestId = ++dutyCheckRequestIdRef.current;
    checkDutyCoverage(start, end)
      .then((covered) => {
        if (requestId !== dutyCheckRequestIdRef.current) return;
        setHasDutyOfficer(covered);
      })
      .catch(() => {
        // On query error keep previous state — don't hide the warning
      });
  }, [date, startTime, endTime, isDutyMode]);

  // ─── Booking submit ───────────────────────────────────────────────────────
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

    setLoading(true);

    try {
      const editingId = edit && bookingId ? bookingId : undefined;
      const busyIdsAtSave = await getAvailableYachtIds(start, end, editingId);
      const stillAvailableYachts = selectedYachts.filter(
        (yacht: { id: string }) => !busyIdsAtSave.includes(yacht.id),
      );

      if (stillAvailableYachts.length !== selectedYachts.length) {
        setAvailableYachtIds(busyIdsAtSave);
        setSelectedYachts(stillAvailableYachts);
        Alert.alert("Błąd", "Wybrany jacht jest już zajęty w tym terminie. Wybierz inny jacht.");
        return;
      }

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

      const covered = await checkDutyCoverage(start, end);
      const bookingStatus = covered
        ? BookingStatus.Pending
        : BookingStatus.NoDutyOfficer;

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
          yachtIds: stillAvailableYachts.map((y: { id: any }) => y.id),
          yachtNames: stillAvailableYachts.map((y: { name: any }) => y.name),
          start,
          end,
          status: bookingStatus,
        });

        Alert.alert("Sukces", "Rezerwacja została zaktualizowana");
      } else {
        await createBooking({
          userId: user.uid,
          userName: fullName,
          yachtIds: stillAvailableYachts.map((y: { id: any }) => y.id),
          yachtNames: stillAvailableYachts.map((y: { name: any }) => y.name),
          start,
          end,
          status: bookingStatus,
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

  // ─── Duty submit ──────────────────────────────────────────────────────────
  async function handleCreateDuty() {
    const name = dutyOfficerName.trim();
    const phone = dutyOfficerPhone.trim();

    if (!name) {
      Alert.alert("Błąd", "Podaj imię i nazwisko dyżurnego");
      return;
    }
    if (!phone) {
      Alert.alert("Błąd", "Podaj numer telefonu dyżurnego");
      return;
    }

    const start = new Date(dutyStartDate);
    start.setHours(dutyStartTime.getHours(), dutyStartTime.getMinutes(), 0, 0);
    const end = new Date(dutyEndDate);
    end.setHours(dutyEndTime.getHours(), dutyEndTime.getMinutes(), 0, 0);

    if (end <= start) {
      Alert.alert("Błąd", "Koniec dyżuru musi być późniejszy niż początek");
      return;
    }

    setDutySubmitting(true);
    try {
      if (isEditingDuty && dutyId) {
        await updateDuty(dutyId, { dutyOfficerName: name, dutyOfficerPhone: phone, start, end });
        Alert.alert("Sukces", "Dyżur został zaktualizowany");
      } else {
        await createDuty({ dutyOfficerName: name, dutyOfficerPhone: phone, start, end });
        Alert.alert("Sukces", "Dyżur został dodany");
      }
      router.replace("/(tabs)/calendar");
    } catch (e: any) {
      if (e?.message === "OVERLAP") {
        Alert.alert("Konflikt", "W podanym terminie istnieje już inny dyżur");
      } else {
        Alert.alert("Błąd", "Nie udało się zapisać dyżuru");
      }
    } finally {
      setDutySubmitting(false);
    }
  }

  // ─── Yachts ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDutyMode) return;
    if (mode === "admin") {
      getYachts().then(setYachts);
    } else {
      getAvailableYachts().then(setYachts);
    }
  }, [edit, bookingId, mode, isDutyMode]);

  useEffect(() => {
    if (!isFocused || isDutyMode) {
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
      getAvailableYachtIds(start, end, editingId)
        .then((busyIds) => {
          if (requestId !== availabilityRequestIdRef.current) return;
          setAvailableYachtIds(busyIds);
          setSelectedYachts((prev: any[]) => prev.filter((y) => !busyIds.includes(y.id)));
        })
        .finally(() => {
          if (requestId === availabilityRequestIdRef.current) {
            setValidatingAvailability(false);
          }
        });
    } else {
      setAvailableYachtIds([]);
      setValidatingAvailability(false);
    }
  }, [isFocused, date, startTime, endTime, yachts, edit, bookingId, isDutyMode]);

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

  const orderedYachts = useMemo(() => {
    const busyIds = new Set(availableYachtIds);
    return [...yachts].sort((a, b) => {
      const aBusy = busyIds.has(a.id) ? 1 : 0;
      const bBusy = busyIds.has(b.id) ? 1 : 0;
      return aBusy - bBusy;
    });
  }, [yachts, availableYachtIds]);

  // ─── Duty form render ─────────────────────────────────────────────────────
  if (isDutyMode) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: isEditingDuty ? "Edytuj dyżur" : "Nowy dyżur",
            headerStyle: headerStyles.header,
            headerTitleStyle: headerStyles.title,
          }}
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Duty officer name with autocomplete */}
          <Text style={styles.label}>Dyżurny</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              value={dutyOfficerName}
              onChangeText={(text) => {
                setDutyOfficerName(text);
                setOfficerSuggestionsVisible(true);
              }}
              placeholder="Imię i nazwisko dyżurnego"
              style={[styles.pickerButton, styles.inputDefaultText]}
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setOfficerSuggestionsVisible(true)}
              onBlur={() => setTimeout(() => setOfficerSuggestionsVisible(false), 200)}
            />
            {officerSuggestionsVisible && officerSuggestions.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  zIndex: 100,
                  maxHeight: 160,
                }}
              >
                {officerSuggestions.map((officer) => (
                  <Pressable
                    key={officer.id}
                    onPress={() => {
                      setDutyOfficerName(officer.name);
                      setDutyOfficerPhone(officer.phone);
                      setOfficerSuggestionsVisible(false);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.textPrimary }}>{officer.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{officer.phone}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Phone */}
          <Text style={styles.label}>Telefon</Text>
          <TextInput
            value={dutyOfficerPhone}
            onChangeText={setDutyOfficerPhone}
            placeholder="+48 000 000 000"
            style={[styles.pickerButton, styles.inputDefaultText]}
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />

          {/* Start */}
          <Text style={styles.label}>Od (data)</Text>
          {isWeb ? (
            <WebDatePicker
              mode="date"
              value={dutyStartDate}
              onChange={(d) => {
                setDutyStartDate(d);
                const dDay = new Date(d); dDay.setHours(0, 0, 0, 0);
                const eDay = new Date(dutyEndDate); eDay.setHours(0, 0, 0, 0);
                if (eDay < dDay) setDutyEndDate(d);
              }}
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <>
              <Pressable style={styles.pickerButton} onPress={() => setShowDutyStartDatePicker(true)}>
                <Text>{dutyStartDate.toLocaleDateString()}</Text>
              </Pressable>
              {showDutyStartDatePicker && (
                <DateTimePicker
                  value={dutyStartDate}
                  mode="date"
                  onChange={(_, d) => {
                    setShowDutyStartDatePicker(false);
                    if (d) {
                      setDutyStartDate(d);
                      const dDay = new Date(d); dDay.setHours(0, 0, 0, 0);
                      const eDay = new Date(dutyEndDate); eDay.setHours(0, 0, 0, 0);
                      if (eDay < dDay) setDutyEndDate(d);
                    }
                  }}
                />
              )}
            </>
          )}

          <Text style={styles.label}>Od (godzina)</Text>
          {isWeb ? (
            <WebDatePicker
              mode="time"
              value={dutyStartTime}
              onChange={(v: Date) => setDutyStartTime(snapToQuarter(v))}
              placeholder="HH:MM"
            />
          ) : (
            <>
              <Pressable style={styles.pickerButton} onPress={() => setShowDutyStartTimePicker(true)}>
                <Text>{dutyStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
              </Pressable>
              {showDutyStartTimePicker && (
                <DateTimePicker
                  value={dutyStartTime}
                  mode="time"
                  display={Platform.OS === "android" ? "spinner" : "default"}
                  onChange={(event, d) => {
                    if (event.type === "dismissed") { setShowDutyStartTimePicker(false); return; }
                    if (d) setDutyStartTime(snapToQuarter(d));
                    if (Platform.OS === "android") setShowDutyStartTimePicker(false);
                  }}
                />
              )}
            </>
          )}

          {/* End */}
          <Text style={styles.label}>Do (data)</Text>
          {isWeb ? (
            <WebDatePicker
              mode="date"
              value={dutyEndDate}
              onChange={setDutyEndDate}
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <>
              <Pressable style={styles.pickerButton} onPress={() => setShowDutyEndDatePicker(true)}>
                <Text>{dutyEndDate.toLocaleDateString()}</Text>
              </Pressable>
              {showDutyEndDatePicker && (
                <DateTimePicker
                  value={dutyEndDate}
                  mode="date"
                  onChange={(_, d) => { setShowDutyEndDatePicker(false); if (d) setDutyEndDate(d); }}
                />
              )}
            </>
          )}

          <Text style={styles.label}>Do (godzina)</Text>
          {isWeb ? (
            <WebDatePicker
              mode="time"
              value={dutyEndTime}
              onChange={(v: Date) => setDutyEndTime(snapToQuarter(v))}
              placeholder="HH:MM"
            />
          ) : (
            <>
              <Pressable style={styles.pickerButton} onPress={() => setShowDutyEndTimePicker(true)}>
                <Text>{dutyEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
              </Pressable>
              {showDutyEndTimePicker && (
                <DateTimePicker
                  value={dutyEndTime}
                  mode="time"
                  display={Platform.OS === "android" ? "spinner" : "default"}
                  onChange={(event, d) => {
                    if (event.type === "dismissed") { setShowDutyEndTimePicker(false); return; }
                    if (d) setDutyEndTime(snapToQuarter(d));
                    if (Platform.OS === "android") setShowDutyEndTimePicker(false);
                  }}
                />
              )}
            </>
          )}
        </ScrollView>

        <Pressable
          style={[styles.submit, { marginTop: 10 }, dutySubmitting && styles.submitDisabled]}
          onPress={handleCreateDuty}
          disabled={dutySubmitting}
        >
          <Text style={styles.submitText}>
            {dutySubmitting ? "Zapisywanie…" : isEditingDuty ? "Zapisz zmiany" : "Dodaj dyżur"}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ─── Booking form render ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: copyBookingId ? "Kopiuj rezerwację" : edit ? "Edytuj rezerwację" : "Nowa rezerwacja",
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
            <Pressable style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Text>{date.toLocaleDateString()}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                minimumDate={isAdmin ? undefined : now}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    const selectedDateOnly = new Date(date);
                    selectedDateOnly.setHours(0, 0, 0, 0);
                    const todayOnly = new Date(now);
                    todayOnly.setHours(0, 0, 0, 0);
                    if (!isAdmin && selectedDateOnly < todayOnly) {
                      Alert.alert("Błąd", "Nie można wybrać przeszłej daty");
                      return;
                    }
                    setDate(date);
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
            <Pressable style={styles.pickerButton} onPress={() => setShowStartPicker(true)}>
              <Text>
                {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display={Platform.OS === "android" ? "spinner" : "default"}
                onChange={(event, date) => {
                  if (event.type === "dismissed") { setShowStartPicker(false); return; }
                  if (date) setStartTime(snapToQuarter(date));
                  if (Platform.OS === "android") setShowStartPicker(false);
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
            <Pressable style={styles.pickerButton} onPress={() => setShowEndPicker(true)}>
              <Text>
                {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Pressable>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.OS === "android" ? "spinner" : "default"}
                onChange={(event, date) => {
                  if (event.type === "dismissed") { setShowEndPicker(false); return; }
                  if (date) setEndTime(snapToQuarter(date));
                  if (Platform.OS === "android") setShowEndPicker(false);
                }}
              />
            )}
          </>
        )}

        {/* Duty officer warning */}
        {hasDutyOfficer === false && (
          <View
            style={{
              backgroundColor: colors.warningSoft,
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginTop: 4,
              marginBottom: 4,
            }}
          >
            <Text style={{ color: colors.warning, fontWeight: "600" }}>
              Brak dyżurnego w tym terminie
            </Text>
            <Text style={{ color: colors.warning, fontSize: 12 }}>
              Booking zostanie zapisany ze statusem "Brak dyżurnego"
            </Text>
          </View>
        )}

        <Text style={styles.label}>Jacht</Text>
        <View style={{ marginTop: 8 }}>
          {orderedYachts.length === 0 ? (
            <Text style={{ color: "#999", marginTop: 8 }}>Brak dostępnych jachtów</Text>
          ) : (
            <FlatList
              data={orderedYachts}
              keyExtractor={(item: { id: any }) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={true}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item: y }) => {
                const selected = selectedYachts.some((item: { id: any }) => item.id === y.id);
                const isAvailable = !availableYachtIds.includes(y.id);
                return (
                  <Pressable
                    onPress={() => {
                      if (!isAvailable) return;
                      setSelectedYachts((prev: any[]) => {
                        const exists = prev.some((item) => item.id === y.id);
                        if (isAdmin) {
                          if (exists) return prev.filter((item) => item.id !== y.id);
                          return [...prev, y];
                        } else {
                          if (exists) return prev.filter((item) => item.id !== y.id);
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
                      <Text style={{ fontSize: 10, color: "#cc0000", marginTop: 4, marginLeft: 8, marginBottom: 5 }}>
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
