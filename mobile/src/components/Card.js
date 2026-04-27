import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSelector } from 'react-redux';
import { getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function Card({ children, style, variant = 'default', onPress }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const cardStyle = [
    styles.card,
    isMobile && styles.cardMobile,
    { backgroundColor: palette.surface, borderColor: palette.gray100 },
    variant === 'outlined' && { backgroundColor: palette.surfaceAlt, borderColor: palette.gray200 },
    variant === 'outlined' ? shadows.sm : shadows.md,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: palette.gray100 }}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardMobile: {
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
});
