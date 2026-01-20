import { useMemo, useState } from 'react';
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

  const today = new Date();

  const baseWeekStart = useMemo(
    () => startOfWeek(new Date()),
    []
  );

  const weekStart = useMemo(
    () => addDays(baseWeekStart, weekOffset * 7),
    [baseWeekStart, weekOffset]
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        addDays(weekStart, i)
      ),
    [weekStart]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kalendarz</Text>

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
                  />
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
      )}
    </View>
  );
}

/* -----------------------------
   Styles
-------------------------------- */

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
});
