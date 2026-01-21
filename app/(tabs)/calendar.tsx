import { headerStyles } from '@/src/theme/header';
import firestore from '@react-native-firebase/firestore';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/* -----------------------------
   Date helpers
-------------------------------- */

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
  });
}

function weekLabel(start: Date) {
  const end = addDays(start, 6);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function getBookingStyle(
  booking: any,
  day: Date
) {
  const start = booking.start.toDate();
  const end = booking.end.toDate();

  if (!sameDay(start, day)) return null;

  const startMinutes =
    start.getHours() * 60 + start.getMinutes();
  const endMinutes =
    end.getHours() * 60 + end.getMinutes();

  return {
    top: (startMinutes / 60) * 36,
    height: ((endMinutes - startMinutes) / 60) * 36,
  };
}

/* -----------------------------
   Constants
-------------------------------- */

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const WEEK_JUMPS = Array.from({ length: 26 }, (_, i) => i);

/* -----------------------------
   Screen
-------------------------------- */

export default function CalendarScreen() {
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const today = new Date();

  const baseWeekStart = useMemo(
    () => startOfWeek(new Date()),
    []
  );

  const weekStart = useMemo(
    () => addDays(baseWeekStart, weekOffset * 7),
    [baseWeekStart, weekOffset]
  );
  useEffect(() => {
    const weekEnd = addDays(weekStart, 7);

    const unsub = firestore()
      .collection('bookings')
      .where('start', '<', weekEnd)
      .where('end', '>', weekStart)
      .onSnapshot(
        (snap) => {
          if (!snap) {
            console.warn('[CALENDAR] snapshot is null');
            setBookings([]);
            return;
          }

          const data = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          setBookings(data);
        },
        (error) => {
          console.error('[CALENDAR] booking subscription error', error);
          setBookings([]);
        }
      );

    return unsub;
  }, [weekStart]);


  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        addDays(weekStart, i)
      ),
    [weekStart]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Kalendarz',
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title
        }}
      />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.modeSwitch}>
          <Pressable
            style={[
              styles.modeButton,
              mode === 'week' && styles.modeActive,
            ]}
            onPress={() => setMode('week')}
          >
            <Text>Tydzień</Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              mode === 'month' && styles.modeActive,
            ]}
            onPress={() => setMode('month')}
          >
            <Text>Miesiąc</Text>
          </Pressable>
        </View>
      </View>

      {/* Week jump */}
      {mode === 'week' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekJump}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {WEEK_JUMPS.map((w) => {
            const start = addDays(baseWeekStart, w * 7);
            return (
              <Pressable
                key={w}
                style={[
                  styles.weekJumpItem,
                  w === weekOffset && styles.weekJumpActive,
                ]}
                onPress={() => setWeekOffset(w)}
              >
                <Text style={styles.weekJumpText}>
                  {weekLabel(start)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Calendar */}
      {mode === 'week' ? (
        <ScrollView>
          {/* Days header */}
          <View style={styles.daysRow}>
            <View style={styles.timeCell} />
            {days.map((day) => {
              const isToday = sameDay(day, today);
              return (
                <View
                  key={day.toISOString()}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayHeader,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                    ]}
                  >
                    {day.toLocaleDateString('pl-PL', {
                      weekday: 'short',
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                    ]}
                  >
                    {formatDate(day)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Time grid */}
          {HOURS.map((h) => (
            <View key={h} style={styles.row}>
              <View style={styles.timeCell}>
                <Text style={styles.timeText}>
                  {String(h).padStart(2, '0')}:00
                </Text>
              </View>

              {days.map((day) => {
                const isToday = sameDay(day, today);
                return (
                  <View
                    key={day.toISOString() + h}
                    style={[
                      styles.slot,
                      isToday && styles.todaySlot,
                    ]}
                  >
                    {h === 0 &&
                      bookings
                        .filter((b) => b.status === 'pending')
                        .map((b) => {
                          const layout = getBookingStyle(b, day);
                          if (!layout) return null;

                          return (
                            <Pressable
                              key={b.id}
                              style={[styles.booking, layout]}
                              onPress={() => setSelectedBooking(b)}
                            >


                              <Text style={styles.bookingTitle}>
                                {b.yachtName}
                              </Text>
                              <Text style={styles.bookingSubtitle}>
                                {b.userName}
                              </Text>
                            </Pressable>
                          );
                        })}
                  </View>

                );
              })}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.monthPlaceholder}>
          <Text style={styles.monthText}>
            Widok miesięczny – do zrobienia
          </Text>
        </View>
      )

      
    }
    
    {selectedBooking && (
    <View style={styles.modalOverlay}>
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>
          {selectedBooking.yachtName}
        </Text>

        <Text style={styles.modalText}>
          👤 {selectedBooking.userName}
        </Text>

        <Text style={styles.modalText}>
          ⏰{' '}
          {selectedBooking.start.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          –{' '}
          {selectedBooking.end.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.modalText}>
          {'Status: '}
          {selectedBooking.status}
        </Text>



        <Pressable
          style={styles.modalClose}
          onPress={() => setSelectedBooking(null)}
        >
          <Text style={styles.modalCloseText}>Zamknij</Text>
        </Pressable>
      </View>
    </View>
  )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 15,
  },

  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },

  modeSwitch: {
    flexDirection: 'row',
    gap: 10,
  },

  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#eee',
  },

  modeActive: {
    backgroundColor: '#cde7ff',
  },

  weekJump: {
    height: 40,
    padding: 2,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  weekJumpItem: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: '#eee',
  },

  weekJumpActive: {
    backgroundColor: '#cde7ff',
  },

  weekJumpText: {
    fontSize: 13,
  },

  daysRow: {
    flexDirection: 'row',
  },

  row: {
    flexDirection: 'row',
  },

  timeCell: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#eee',
  },

  timeText: {
    fontSize: 11,
    color: '#555',
  },

  dayCell: {
    flex: 1,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },

  dayText: {
    fontSize: 12,
  },

  todayHeader: {
    backgroundColor: '#eef6ff',
  },

  todayText: {
    fontWeight: '600',
    color: '#1e5eff',
  },

  slot: {
    flex: 1,
    height: 36,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  todaySlot: {
    backgroundColor: '#f6fbff',
  },

  monthPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  monthText: {
    color: '#777',
  },

  booking: {
    position: 'absolute',
    left: 2,
    right: 2,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    padding: 4,
    zIndex: 10,
  },

  bookingTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },

  bookingSubtitle: {
    fontSize: 10,
    color: '#555',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  modal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },

  modalText: {
    fontSize: 14,
    marginBottom: 8,
  },

  modalClose: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },

  modalCloseText: {
    color: '#1e5eff',
    fontSize: 14,
    fontWeight: '500',
  },

});
