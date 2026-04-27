import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { durations, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function StyledInput({ label, error, style, containerStyle, ...props }) {
  const [focused, setFocused] = useState(false);
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const inputTextColor = themeMode === 'dark' ? palette.white : palette.gray800;

  const animateFocus = (toValue) => {
    Animated.timing(borderAnim, {
      toValue,
      duration: durations.normal,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? palette.red : palette.gray200, error ? palette.red : palette.green],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: palette.gray600 }]}>{label}</Text> : null}
      <Animated.View
        style={[
          styles.inputWrap,
          { borderColor, backgroundColor: palette.surface },
          focused && shadows.sm,
          focused && { borderColor: error ? palette.red : palette.green },
          error && !focused && { borderColor: palette.red },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: inputTextColor },
            style,
          ]}
          placeholderTextColor={themeMode === 'dark' ? palette.gray400 : palette.gray500}
          selectionColor={palette.green}
          cursorColor={palette.green}
          textAlignVertical="center"
          onFocus={(e) => {
            setFocused(true);
            animateFocus(1);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            animateFocus(0);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </Animated.View>
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
  inputWrap: {
    borderWidth: 1.5,
    borderRadius: radii.lg,
    overflow: 'hidden',
    minHeight: 52,
  },
  input: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...fonts.base,
    height: 52,
    fontSize: 16,
    lineHeight: 22,
    ...fonts.medium,
  },
  errorText: {
    ...fonts.xs,
    marginLeft: 2,
  },
});
