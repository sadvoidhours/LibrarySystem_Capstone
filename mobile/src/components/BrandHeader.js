import React from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSelector } from 'react-redux';
import { fonts, getThemePalette, radii, spacing } from '../theme/colors';

export default function BrandHeader({ title, subtitle, avatarUri }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  return (
    <View style={[styles.wrapper, isMobile && styles.wrapperMobile, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
      <View style={[styles.logoWrap, isMobile && styles.logoWrapMobile, { backgroundColor: palette.yellowSoft, borderColor: palette.greenLight }]}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={[styles.logo, isMobile && styles.logoMobile]} />
        ) : (
          <Image source={require('../../assets/logo.png')} style={[styles.logo, isMobile && styles.logoMobile]} />
        )}
      </View>
      <View style={styles.textWrap}>
        {!isMobile ? (
          <Text style={[styles.kicker, { color: palette.green }]}>Pateros Technological College</Text>
        ) : null}
        <Text style={[isMobile ? styles.titleMobile : styles.title, { color: palette.gray800 }]}>{title}</Text>
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
  wrapperMobile: {
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  logoWrap: {
    width: 54,
    height: 54,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoWrapMobile: {
    width: 40,
    height: 40,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
  },
  logoMobile: {
    width: 32,
    height: 32,
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
  titleMobile: {
    ...fonts.base,
    ...fonts.bold,
  },
  subtitle: {
    ...fonts.sm,
    marginTop: 2,
  },
});
