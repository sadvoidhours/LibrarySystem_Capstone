import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, spacing } from '../theme/colors';
import Card from './Card';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toDateKey = (date) => date.toISOString().slice(0, 10);

const startOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const endOfWeek = (date) => {
  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return end;
};

const buildCalendarDays = (rangeStart, rangeEnd) => {
  const days = [];
  const cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const parseHex = (hex) => {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;

  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const mixColors = (from, to, ratio) => {
  const start = parseHex(from);
  const end = parseHex(to);
  const mix = (a, b) => Math.round(a + (b - a) * ratio);
  return `#${[mix(start.r, end.r), mix(start.g, end.g), mix(start.b, end.b)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
};

export default function CalendarHeatmap({ title, subtitle, rangeStart, rangeEnd, items = [] }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  const { days, countByKey, maxValue, startKey, endKey } = useMemo(() => {
    if (!rangeStart || !rangeEnd) {
      return { days: [], countByKey: new Map(), maxValue: 1, startKey: '', endKey: '' };
    }

    const startDate = new Date(rangeStart);
    const endDate = new Date(rangeEnd);
    const gridStart = startOfWeek(startDate);
    const gridEnd = endOfWeek(endDate);
    const dayList = buildCalendarDays(gridStart, gridEnd);
    const counts = new Map(items.map((item) => [item.label, item.value]));
    const maxCount = Math.max(...items.map((item) => Number(item.value) || 0), 1);

    return {
      days: dayList,
      countByKey: counts,
      maxValue: maxCount,
      startKey: toDateKey(startDate),
      endKey: toDateKey(endDate),
    };
  }, [rangeStart, rangeEnd, items]);

  const getCellColor = (value, isInRange) => {
    if (!isInRange) {
      return palette.gray100;
    }

    if (!value) {
      return palette.surfaceAlt;
    }

    const ratio = Math.min(1, value / maxValue);
    return mixColors(palette.greenLight, palette.green, ratio);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.gray800 }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: palette.gray500 }]}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={[styles.weekLabel, { color: palette.gray500 }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day) => {
          const key = toDateKey(day);
          const value = Number(countByKey.get(key) || 0);
          const isInRange = key >= startKey && key <= endKey;
          return (
            <View
              key={key}
              style={[
                styles.dayCell,
                {
                  backgroundColor: getCellColor(value, isInRange),
                  borderColor: palette.gray100,
                },
              ]}
            >
              <Text style={[styles.dayNumber, { color: isInRange ? palette.gray800 : palette.gray400 }]}>
                {day.getDate()}
              </Text>
              {isInRange ? (
                <Text style={[styles.dayValue, { color: palette.gray600 }]}>{value}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...fonts.base,
    ...fonts.bold,
    letterSpacing: 0.2,
  },
  subtitle: {
    ...fonts.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  weekLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    width: 36,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayCell: {
    width: 36,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayNumber: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  dayValue: {
    ...fonts.xs,
  },
});
