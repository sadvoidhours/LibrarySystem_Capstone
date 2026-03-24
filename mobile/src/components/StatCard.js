import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function StatCard({ icon, iconColor, label, value, accentBg, style }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const resolvedIconColor = iconColor || palette.chestnut;

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.gray100 }, shadows.sm, accentBg && { backgroundColor: accentBg }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: resolvedIconColor + '18' }]}>
        <Ionicons name={icon || 'stats-chart'} size={22} color={resolvedIconColor} />
      </View>
      <Text style={[styles.value, { color: palette.gray800 }]}>{value ?? 0}</Text>
      <Text style={[styles.label, { color: palette.gray500 }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    minWidth: 100,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    ...fonts.xl,
    ...fonts.bold,
  },
  label: {
    ...fonts.xs,
    ...fonts.medium,
    textAlign: 'center',
  },
});
