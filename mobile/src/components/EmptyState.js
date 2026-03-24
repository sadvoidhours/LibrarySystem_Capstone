import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, spacing } from '../theme/colors';

export default function EmptyState({ icon = 'file-tray-outline', message = 'Nothing here yet.' }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: palette.greenLight }]}>
        <Ionicons name={icon} size={32} color={palette.green} />
      </View>
      <Text style={[styles.text, { color: palette.gray500 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...fonts.base,
    textAlign: 'center',
  },
});
