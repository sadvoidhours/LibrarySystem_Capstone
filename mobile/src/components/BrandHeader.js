import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, spacing } from '../theme/colors';

export default function BrandHeader({ title, subtitle, avatarUri }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  return (
    <View style={[styles.wrapper, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
      <View style={[styles.logoWrap, { backgroundColor: palette.yellowSoft, borderColor: palette.greenLight }]}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.logo} />
        ) : (
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.kicker, { color: palette.green }]}>Pateros Technological College</Text>
        <Text style={[styles.title, { color: palette.gray800 }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: palette.gray500 }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  logoWrap: {
    width: 54,
    height: 54,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
  },
  textWrap: {
    flex: 1,
  },
  kicker: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    ...fonts.lg,
    ...fonts.bold,
  },
  subtitle: {
    ...fonts.sm,
    marginTop: 2,
  },
});
