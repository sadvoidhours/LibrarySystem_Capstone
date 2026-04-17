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
    variant === 'outlined' && { backgroundColor: 'transparent', borderColor: palette.gray200 },
    shadows.sm,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
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
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  cardMobile: {
    padding: spacing.md,
  },
});
