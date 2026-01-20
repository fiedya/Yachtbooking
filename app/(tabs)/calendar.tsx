import { View, StyleSheet, Text, Pressable, Modal } from 'react-native';
import { Calendar } from 'react-native-big-calendar';
import { useState } from 'react';
import dayjs from 'dayjs';

import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { Typography } from '../../src/theme/typography';

type CalendarMode = 'week' | 'month';

const WEEK_JUMPS = [0, 1, 2, 3, 4,5,6,7, 8,9,10,11, 12];

function formatWeekRange(weeksFromNow: number): string {
  const base = dayjs().add(weeksFromNow, 'week');

  const start = base.startOf('week').add(1, 'day');
  const end = start.add(6, 'day');

  return `${start.format('DD.MM')} – ${end.format('DD.MM')}`;
}


export default function CalendarScreen() {
  const [mode, setMode] = useState<CalendarMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekPickerVisible, setWeekPickerVisible] = useState(false);

  function goPrevious() {
    setCurrentDate(dayjs(currentDate).subtract(1, mode).toDate());
  }

  function goNext() {
    setCurrentDate(dayjs(currentDate).add(1, mode).toDate());
  }

  function jumpWeeks(weeks: number) {
    setCurrentDate(dayjs().add(weeks, 'week').toDate());
    setWeekPickerVisible(false);
  }

  function getHeaderLabel() {
    if (mode === 'month') {
      return dayjs(currentDate).format('MMMM YYYY');
    }

    const start = dayjs(currentDate).startOf('week').add(1, 'day');
    const end = start.add(6, 'day');

    return `${start.format('DD MMM')} – ${end.format('DD MMM YYYY')}`;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goPrevious} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>

        <Pressable
          onPress={() => mode === 'week' && setWeekPickerVisible(true)}
        >
          <Text style={styles.headerText}>
            {getHeaderLabel()} {mode === 'week' ? '▾' : ''}
          </Text>
        </Pressable>

        <Pressable onPress={goNext} style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      {/* Mode selector */}
      <View style={styles.modeSelector}>
        <Pressable
          style={[styles.modeButton, mode === 'week' && styles.activeMode]}
          onPress={() => setMode('week')}
        >
          <Text style={styles.modeText}>Week</Text>
        </Pressable>

        <Pressable
          style={[styles.modeButton, mode === 'month' && styles.activeMode]}
          onPress={() => setMode('month')}
        >
          <Text style={styles.modeText}>Month</Text>
        </Pressable>
      </View>

      {/* Calendar */}
      <Calendar
        height={mode === 'month' ? 700 : 600}
        mode={mode}
        date={currentDate}
        events={[]}
        swipeEnabled
        weekStartsOn={1}
      />

      {/* Week picker modal */}
      <Modal
        visible={weekPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeekPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setWeekPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            {WEEK_JUMPS.map(weeks => (
            <Pressable
                key={weeks}
                style={styles.modalItem}
                onPress={() => jumpWeeks(weeks)}
            >
                <Text style={styles.modalText}>
                {formatWeekRange(weeks)}
                </Text>
            </Pressable>
            ))}


          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },

  headerText: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },

  arrow: {
    padding: Spacing.sm,
  },

  arrowText: {
    fontSize: 26,
    color: Colors.primary,
  },

  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },

  modeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  activeMode: {
    borderBottomWidth: 2,
    borderColor: Colors.primary,
  },

  modeText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    width: '80%',
    paddingVertical: Spacing.sm,
  },

  modalItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  modalText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
});
