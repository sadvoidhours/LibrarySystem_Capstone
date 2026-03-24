import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function Card({ children, style, variant = 'default' }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.gray100 },
        variant === 'outlined' && { backgroundColor: 'transparent', borderColor: palette.gray200 },
        shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
});
