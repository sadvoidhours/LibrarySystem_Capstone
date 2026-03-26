import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, spacing } from '../theme/colors';
import Card from './Card';

export default function MiniBarChart({ title, subtitle, items = [] }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.gray800 }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: palette.gray500 }]}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.chartRow}>
        {items.map((item) => {
          const value = Number(item.value) || 0;
          const heightPercent = `${Math.max(8, (value / maxValue) * 100)}%`;
          const barColor = item.color || palette.green;
          return (
            <View key={item.label} style={styles.barGroup}>
              <View style={[styles.barTrack, { backgroundColor: palette.gray100 }]}>
                <View style={[styles.barFill, { height: heightPercent, backgroundColor: barColor }]} />
              </View>
              <Text style={[styles.barValue, { color: palette.gray800 }]}>{value}</Text>
              <Text style={[styles.barLabel, { color: palette.gray500 }]} numberOfLines={2}>
                {item.label}
              </Text>
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
  },
  subtitle: {
    ...fonts.xs,
    marginTop: 2,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 56,
  },
  barTrack: {
    width: '100%',
    height: 120,
    borderRadius: radii.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: radii.lg,
  },
  barValue: {
    ...fonts.sm,
    ...fonts.bold,
  },
  barLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    textAlign: 'center',
  },
});
