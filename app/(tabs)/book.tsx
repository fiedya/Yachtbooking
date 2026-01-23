import { Yacht } from '@/src/entities/yacht';
import { createBooking } from '@/src/services/booking.service';
import { getAvailableYachtIds } from '@/src/services/calendarService';
import { getUser } from '@/src/services/userService';
import { getActiveYachts } from '@/src/services/yachtService';
import { colors } from '@/src/theme/colors';
import { headerStyles } from '@/src/theme/header';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';



export default function BookScreen() {
  const user = auth().currentUser;
  const router = useRouter();
  const { startDate: paramStartDate, endDate: paramEndDate } = useLocalSearchParams<{ startDate?: string; endDate?: string }>();

  // Initialize dates from params if provided, otherwise use now
  const initializeDate = () => {
    if (paramStartDate) {
      return new Date(paramStartDate);
    }
    return new Date();
  };

  const initializeStartTime = () => {
    if (paramStartDate) {
      return new Date(paramStartDate);
    }
    return new Date();
  };

  const initializeEndTime = () => {
    if (paramEndDate) {
      return new Date(paramEndDate);
    }
    const end = new Date();
    end.setHours(end.getHours() + 1);
    return end;
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [date, setDate] = useState(initializeDate());
  const [startTime, setStartTime] = useState(initializeStartTime());
  const [endTime, setEndTime] = useState(initializeEndTime());
  const [loading, setLoading] = useState(false);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [availableYachtIds, setAvailableYachtIds] = useState<string[]>([]);
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [bookingName, setBookingName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);


  async function handleBook() {
    if (!user) return;

    const start = new Date(date);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (end <= start) {
      Alert.alert('Błąd', 'Godzina zakończenia musi być późniejsza');
      return;
    }

    if (!yacht) {
      Alert.alert('Błąd', 'Nie wybrano jachtu');
      return;
    }

    setLoading(true);

    try {

      const profile = await getUser(user.uid);

      let fullName = '';

      if (isAdmin && bookingName.trim()) {
        // admin booking for outsider
        fullName = bookingName.trim();
      } else if (profile) {
        // normal user booking
        fullName = `${profile.name} ${profile.surname}`;
      } else {
        fullName = user.phoneNumber || '';
      }


      if (isAdmin && !bookingName.trim()) {
        Alert.alert(
          'Błąd',
          'Podaj imię i nazwisko osoby rezerwującej'
        );
        return;
      }


      await createBooking({
        userId: user.uid,
        userName: fullName,
        yachtId: yacht.id,
        yachtName: yacht.name,
        start,
        end,
      });

      Alert.alert('Sukces', 'Rezerwacja została zapisana');
      router.replace('/(tabs)/calendar');


          } catch (e) {
            console.error('[BOOKING ERROR]', e);
            Alert.alert('Błąd', 'Nie udało się zapisać rezerwacji');
          } finally {
            setLoading(false);
          }
        }

  useEffect(() => {
    if (!user) return;

    getUser(user.uid).then(profile => {
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    });
  }, [user?.uid]);


  useEffect(() => {
    getActiveYachts().then(data => {
      setYachts(data);
      if (data.length > 0) {
        setYacht(data[0]); // default selection
      }
    });
  }, []);

  useEffect(() => {
    const start = new Date(date);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (end > start) {
      getAvailableYachtIds(start, end).then(busyIds => {
        setAvailableYachtIds(busyIds);
        // If current yacht becomes unavailable, select another one
        if (yacht && busyIds.includes(yacht.id)) {
          const availableYacht = yachts.find(y => !busyIds.includes(y.id));
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
          title: 'Nowa rezerwacja',
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title
        }}
      />
      {isAdmin && (
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
          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {yachts.map(y => {
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
                  : require('@/assets/images/yacht_placeholder.png')
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
                !isAvailable && { color: '#999' },
              ]}
              numberOfLines={1}
            >
              {y.name}
            </Text>
            {!isAvailable && (
              <Text style={{ fontSize: 10, color: '#cc0000', marginTop: 4, marginLeft: 8, marginBottom: 5 }}>
                Zajęty
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>

    {yachts.length === 0 && (
      <Text style={{ color: '#999', marginTop: 8 }}>
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
          {loading ? 'Zapisywanie…' : 'Zarezerwuj'}
        </Text>
      </Pressable>
    </View>
  );
}


/* -----------------------------
   Styles
-------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 15,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },

  label: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },

  yacht: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  yachtActive: {
    borderColor: colors.primary,
    backgroundColor: '#eef3ff',
  },

  yachtText: {
    fontSize: 15,
  },

  submit: {
    marginTop: 32,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  submitDisabled: {
    opacity: 0.6,
  },

  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  pickerButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
},
yachtCard: {
  width: 120,
  marginRight: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#ddd',
  backgroundColor: '#fff',
  overflow: 'hidden',
},

yachtCardActive: {
  borderColor: colors.primary,
  backgroundColor: '#eef3ff',
},

yachtCardDisabled: {
  opacity: 0.5,
},

yachtImage: {
  width: '100%',
  height: 80,
  backgroundColor: '#eee',
},

yachtName: {
  paddingVertical: 4,
  paddingHorizontal: 8,
  fontSize: 14,
  textAlign: 'center',
},

yachtNameActive: {
  fontWeight: '600',
  color: colors.primary,
},

});
