import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, spacing } from '../theme/colors';

export default function StyledInput({ label, error, style, containerStyle, ...props }) {
  const [focused, setFocused] = useState(false);
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: palette.gray600 }]}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          { borderColor: palette.gray200, backgroundColor: palette.surface, color: palette.gray800 },
          focused && styles.focused,
          error && styles.errorBorder,
          style,
        ]}
        placeholderTextColor={palette.gray400}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error ? <Text style={[styles.errorText, { color: palette.red }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...fonts.sm,
    ...fonts.semibold,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...fonts.base,
    minHeight: 48,
  },
  focused: {},
  errorBorder: {},
  errorText: {
    ...fonts.xs,
    marginLeft: 2,
  },
});
