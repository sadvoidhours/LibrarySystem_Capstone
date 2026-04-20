import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from './Icon';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function StatCard({ icon, iconColor, label, value, accentBg, style }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const resolvedIconColor = iconColor || palette.chestnut;

  return (
    <View style={[styles.card, isMobile && styles.cardMobile, { backgroundColor: palette.surface, borderColor: palette.gray100 }, shadows.sm, accentBg && { backgroundColor: accentBg }, style]}>
      <View style={[styles.iconWrap, isMobile && styles.iconWrapMobile, { backgroundColor: resolvedIconColor }]}>
        <Icon name={icon || 'stats-chart'} size={isMobile ? 18 : 22} color={palette.white} />
      </View>
      <Text style={[styles.value, isMobile && styles.valueMobile, { color: palette.gray800 }]}>{value ?? 0}</Text>
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
  cardMobile: {
    minWidth: 80,
    padding: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconWrapMobile: {
    width: 36,
    height: 36,
  },
  value: {
    ...fonts.xl,
    ...fonts.bold,
  },
  valueMobile: {
    ...fonts.lg,
    ...fonts.bold,
  },
  label: {
    ...fonts.xs,
    ...fonts.medium,
    textAlign: 'center',
  },
});
