import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../components/Icon';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthFeedback, login } from '../store/slices/authSlice';
import { baseStyles, fonts, getThemePalette, palette, radii, shadows, spacing } from '../theme/colors';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';

const PTC_EMAIL_REGEX = /^[a-z]+@paterostechnologicalcollege\.edu\.ph$/;

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const p = palette; // pre-auth always light
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const clearErrors = () => {
    if (localError) setLocalError('');
    if (error) dispatch(clearAuthFeedback());
  };

  const onLogin = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setLocalError('Email and password are required.');
      return;
    }
    if (!PTC_EMAIL_REGEX.test(trimmedEmail)) {
      setLocalError('Use initials+lastname@paterostechnologicalcollege.edu.ph');
      return;
    }
    setLocalError('');
    dispatch(login({ email: trimmedEmail, password }));
  };

  const displayError = localError || (!localError && error) || '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { backgroundColor: p.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, baseStyles.webCenter]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Landing')}
          >
            <Icon name="arrow-back" size={18} color={p.green} />
            <Text style={[styles.backText, { color: p.green }]}>Back to Home</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.logoWrap, { backgroundColor: p.greenLight }]}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} />
            </View>
            <View style={[styles.badge, { backgroundColor: p.greenLight }]}>
              <Text style={[styles.badgeText, { color: p.green }]}>Student / Faculty Access</Text>
            </View>
            <Text style={[styles.title, { color: p.gray800 }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: p.gray500 }]}>Sign in to your library account</Text>
          </View>

          <Card style={styles.form}>
            <StyledInput
              label="Email"
              placeholder="name@ptc.edu.ph"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(v) => { setEmail(v); clearErrors(); }}
            />
            <StyledInput
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); clearErrors(); }}
            />

            {displayError ? (
              <View style={[styles.errorBox, { backgroundColor: p.redLight }]}>
                <Icon name="alert-circle" size={16} color={p.red} />
                <Text style={[styles.errorText, { color: p.red }]}>{displayError}</Text>
              </View>
            ) : null}

            <StyledButton title="Sign In" variant="success" onPress={onLogin} loading={loading} />
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerLabel, { color: p.gray500 }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: p.green }]}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 440,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  backText: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  logoWrap: {
    alignSelf: 'center',
    borderRadius: radii.full,
    padding: 4,
    ...shadows.sm,
    marginBottom: spacing.xs,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
  },
  title: {
    ...fonts.xl,
    ...fonts.bold,
    textAlign: 'center',
  },
  subtitle: {
    ...fonts.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  errorText: {
    ...fonts.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  footerLabel: {
    ...fonts.sm,
  },
  footerLink: {
    ...fonts.sm,
    ...fonts.bold,
  },
});
