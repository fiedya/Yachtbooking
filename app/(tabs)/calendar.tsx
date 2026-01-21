import { headerStyles } from '@/src/theme/header';
import { styles, styles as theme } from '@/src/theme/styles';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import {
  Pressable,
  ScrollView,
  Text,
  View
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


/* -----------------------------
   Screen
-------------------------------- */

export default function CalendarScreen() {
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    console.log('[CALENDAR] subscribing, key:', refreshKey);

    const weekEnd = addDays(weekStart, 7);

    const unsub = firestore()
      .collection('bookings')
      .where('start', '<', weekEnd)
      .where('end', '>', weekStart)
      .onSnapshot(
        snap => {
          if (!snap) {
            setBookings([]);
            setIsRefreshing(false);
            return;
          }

          const data = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          }));

          setBookings(data);
          setIsRefreshing(false); 
        },
        error => {
          console.error('[CALENDAR] error', error);
          setIsRefreshing(false);
        }
      );

    return unsub;
  }, [weekStart, refreshKey]);


  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        addDays(weekStart, i)
      ),
    [weekStart]
  );

  

  return (
    <View style={theme.screen}>
    <Stack.Screen
      options={{
        headerShown: true,
        title: 'Kalendarz',
        headerStyle: headerStyles.header,
        headerTitleStyle: headerStyles.title,
        headerRight: () => (
          <Pressable
            onPress={() => setRefreshKey(k => k + 1)}
            style={{ margin: 10, paddingRight:'5%' }}>
            <Ionicons name="refresh" size={24} color={isRefreshing ? '#999' : '#000'}/>
          </Pressable>
        ),
      }}
    />

      {/* Header */}
      <View style={[theme.cardPadding, theme.gridBorderBottom]}>
        <View style={[theme.row, { gap: 8 }]}>
          <Pressable
            style={[
                theme.pill,
                mode === 'week' && theme.pillActive,
              ]}
            onPress={() => setMode('week')}
          >
            <Text
              style={mode === 'week' ? theme.textOnPrimary : theme.textSecondary}
            >
              Tydzień
            </Text>
          </Pressable>

          <Pressable
            style={[
                theme.pill,
                mode === 'month' && theme.pillActive,
              ]}
            onPress={() => setMode('month')}
          >
            <Text
              style={mode === 'month' ? theme.textOnPrimary : theme.textSecondary}
            >
              Miesiąc
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Week jump */}
      {mode === 'week' && (
        <View style={[theme.row, theme.gridBorderBottom, { padding: 12, alignItems: 'center' }]}>
          
          {/* Previous week */}
          <Pressable
            onPress={() => setWeekOffset(o => o - 1)}
            style={theme.iconButton}
          >
            <Ionicons name="chevron-back-outline"/>
          </Pressable>

          {/* Current week label */}
          <Pressable
            onPress={() => setShowWeekPicker(true)}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Text style={theme.textPrimary}>
              {weekLabel(weekStart)}
            </Text>
            <Text style={theme.textMuted}>Ten tydzień</Text>
          </Pressable>

          {/* Next week */}
          <Pressable
            onPress={() => setWeekOffset(o => o + 1)}
            style={theme.iconButton}
          >
            <Ionicons name="chevron-forward-outline"/>
          </Pressable>

        </View>
      )}


      {/* Calendar */}
      {mode === 'week' ? (
        <ScrollView>
          {/* Days header */}
          <View style={theme.gridRow}>
            <View  style={[
              theme.gridCellCenter,
              theme.gridBorderRight,
              { width: 56 },
            ]} />
            {days.map((day) => {
              const isToday = sameDay(day, today);
              return (
                <View
                  key={day.toISOString()}
                  style={[
                      theme.gridCellCenter,
                      theme.gridBorderRight,
                      { flex: 1, paddingVertical: 6 },
                      isToday && theme.highlightBackground,
                    ]}
                >
                  <Text
                    style={isToday ? theme.highlightText : theme.textSecondary}>
                    {day.toLocaleDateString('pl-PL', {
                      weekday: 'short',
                    })}
                  </Text>
                  <Text
                    style={isToday ? theme.highlightText : theme.textSecondary}
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
              <View style={[
                theme.gridCellCenter,
                theme.gridBorderRight,
                { width: 56 },
              ]}>
                <Text style={theme.textXs}>
                  {String(h).padStart(2, '0')}:00
                </Text>
              </View>

              {days.map((day) => {
                const isToday = sameDay(day, today);
                return (
                  <View
                    key={day.toISOString() + h}
                    pointerEvents="box-none"
                    style={[
                      theme.gridBorderRight,
                      theme.gridBorderBottom,
                      { flex: 1, height: 36 },
                      isToday && theme.highlightBackground,
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
                              style={[
                                  theme.absoluteCard,
                                  { backgroundColor: '#e0e0e0' },
                                  layout,
                                ]}
                                onPress={() => {
                                    console.log('BOOKING PRESSED', b.id);
                                    setSelectedBooking(b);
                                }}
                            >
                              <Text style={[theme.textXs, { fontWeight: '600' }]}>{b.yachtName}</Text>
                              <Text style={theme.textXs}>{b.userName}</Text>
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
        <View style={[theme.screen, theme.center]}>
          <Text style={theme.textMuted}>
            Widok miesięczny – do zrobienia
          </Text>
        </View>
      )

      
    }
    
    {selectedBooking && (
    <View style={theme.modalOverlay}>
      <View style={theme.modal}>
        <Text style={theme.title}>
          {selectedBooking.yachtName}
        </Text>

        <Text style={theme.textPrimary}>
          👤 {selectedBooking.userName}
        </Text>

        <Text style={theme.textPrimary}>
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
        <Text style={theme.textPrimary}>
          {'Status: '}
          {selectedBooking.status}
        </Text>



      <Pressable style={{ marginTop: 16, alignSelf: 'flex-end' }} onPress={() => setSelectedBooking(null)}>
        <Text style={theme.link}>Zamknij</Text>
      </Pressable>

      </View>
    </View>
  )}
  {showWeekPicker && (
    <View style={theme.modalOverlay}>
      <View style={theme.modal}>
        <Text style={theme.title}>Wybierz tydzień</Text>

        <ScrollView style={{ maxHeight: 300 }}>
          {Array.from({ length: 12 }, (_, i) => {
            const offset = i - 2; // few past, few future
            const start = addDays(baseWeekStart, offset * 7);

            return (
              <Pressable
                key={offset}
                style={[
                  theme.listItem,
                  offset === weekOffset && theme.listItemActive,
                ]}
                onPress={() => {
                  setWeekOffset(offset);
                  setShowWeekPicker(false);
                }}
              >
                <Text
                  style={
                    offset === weekOffset
                      ? theme.textOnPrimary
                      : theme.textPrimary
                  }
                >
                  {weekLabel(start)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => setShowWeekPicker(false)}
          style={{ marginTop: 16, alignSelf: 'flex-end' }}
        >
          <Text style={theme.link}>Zamknij</Text>
        </Pressable>
      </View>
    </View>
  )}

    </View>

    
  );
}
