import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function StyledButton({
  title, onPress, variant = 'primary', loading = false, disabled = false, style, icon, small = false,
}) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const variants = {
    primary:      { bg: palette.chestnut,      text: palette.white },
    secondary:    { bg: palette.gray200,       text: palette.gray700 },
    success:      { bg: palette.green,         text: palette.white },
    danger:       { bg: palette.red,           text: palette.white },
    outline:      { bg: 'transparent',         text: palette.chestnut, border: palette.chestnut },
    outlineGreen: { bg: 'transparent',         text: palette.green, border: palette.green },
    outlineWhite: { bg: palette.white,         text: palette.green, border: palette.white },
  };

  const v = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        small && styles.small,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1.5, borderColor: v.border },
        shadows.sm,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon || null}
          <Text style={[styles.text, small && styles.smallText, { color: v.text }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
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
    minHeight: 48,
  },
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 36,
  },
  text: {
    ...fonts.base,
    ...fonts.bold,
    letterSpacing: 0.2,
  },
  smallText: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  disabled: {
    opacity: 0.55,
  },
});
