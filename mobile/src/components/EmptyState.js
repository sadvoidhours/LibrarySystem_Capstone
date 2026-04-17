import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, spacing } from '../theme/colors';

export default function EmptyState({ icon = 'file-tray-outline', message = 'Nothing here yet.' }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  return (
    <View style={[styles.wrap, isMobile && styles.wrapMobile]}>
      <View style={[styles.iconWrap, isMobile && styles.iconWrapMobile, { backgroundColor: palette.greenLight }]}>
        <Ionicons name={icon} size={isMobile ? 24 : 32} color={palette.green} />
      </View>
      <Text style={[styles.text, { color: palette.gray500 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  wrapMobile: {
    paddingVertical: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapMobile: {
    width: 56,
    height: 56,
  },
  text: {
    ...fonts.base,
    textAlign: 'center',
  },
});
