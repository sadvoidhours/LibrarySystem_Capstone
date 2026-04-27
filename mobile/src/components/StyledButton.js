import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function StyledButton({
  title, onPress, variant = 'primary', loading = false, disabled = false, style, icon, small = false,
}) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const variants = {
    primary:      { bg: palette.chestnut,      text: palette.white },
    secondary:    { bg: palette.gray200,       text: palette.gray700 },
    success:      { bg: palette.green,         text: palette.white },
    danger:       { bg: palette.red,           text: palette.white },
    outline:      { bg: palette.surfaceAlt,    text: palette.chestnut, border: palette.chestnut, shadow: false },
    outlineGreen: { bg: palette.greenLight,    text: palette.green, border: palette.green, shadow: false },
    outlineWhite: { bg: 'transparent',         text: palette.white, border: palette.white },
  };

  const v = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        android_ripple={{ color: palette.gray100 }}
        style={({ pressed }) => [
          styles.button,
          small && styles.small,
          { backgroundColor: v.bg },
          v.border && { borderWidth: 1.5, borderColor: v.border },
          v.shadow === false ? null : shadows.md,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <>
            {icon ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
            <Text style={[styles.text, small && styles.smallText, { color: v.text }]}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    gap: spacing.sm,
    minHeight: 50,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 38,
  },
  text: {
    ...fonts.base,
    ...fonts.bold,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.95,
  },
  smallText: {
    ...fonts.sm,
    ...fonts.semibold,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.55,
  },
});
