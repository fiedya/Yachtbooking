import { createBooking } from '@/src/services/booking.service';
import { getUser } from '@/src/services/userService';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

const YACHTS = [
  { id: 'odesa', name: 'Odesa' },
  { id: 'helena', name: 'Helena' },
  { id: 'baltyk', name: 'Bałtyk' },
];

export default function BookScreen() {
  const user = auth().currentUser;
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [yacht, setYacht] = useState(YACHTS[0]);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {

      const profile = await getUser(user.uid);

      const fullName = profile
        ? `${profile.name} ${profile.surname}`
        : user.phoneNumber || '';

      await createBooking({
        userId: user.uid,
        userName: fullName,
        yachtId: yacht.id,
        yachtName: yacht.name,
        start,
        end,
      });

      Alert.alert('Sukces', 'Rezerwacja została zapisana');
    } catch (e) {
      console.error('[BOOKING ERROR]', e);
      Alert.alert('Błąd', 'Nie udało się zapisać rezerwacji');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nowa rezerwacja</Text>

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


      {/* Yacht */}
      <Text style={styles.label}>Jacht</Text>
      {YACHTS.map(y => (
        <Pressable
          key={y.id}
          style={[
            styles.yacht,
            yacht.id === y.id && styles.yachtActive,
          ]}
          onPress={() => setYacht(y)}
        >
          <Text style={styles.yachtText}>{y.name}</Text>
        </Pressable>
      ))}

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
    borderColor: '#1e5eff',
    backgroundColor: '#eef3ff',
  },

  yachtText: {
    fontSize: 15,
  },

  submit: {
    marginTop: 32,
    backgroundColor: '#1e5eff',
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

});
