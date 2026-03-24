import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthFeedback, login } from '../store/slices/authSlice';
import { baseStyles, fonts, palette, radii, shadows, spacing } from '../theme/colors';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';

const PTC_EMAIL_REGEX = /^[a-z]+@paterostechnologicalcollege\.edu\.ph$/;

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, baseStyles.webCenter]}>
          {/* Back to Home */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Landing')}
          >
            <Ionicons name="arrow-back" size={18} color={palette.green} />
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Student / Faculty Access</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your library account</Text>
          </View>

          {/* Form Card */}
          <Card style={styles.form}>
            <StyledInput
              label="Email"
              placeholder="jabellino@paterostechnologicalcollege.edu.ph"
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
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={palette.red} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            <StyledButton title="Sign In" variant="success" onPress={onLogin} loading={loading} />
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create Account</Text>
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
    backgroundColor: palette.background,
  },
  container: {
    padding: spacing.xl,
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
    color: palette.green,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: palette.greenLight,
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  logoWrap: {
    alignSelf: 'center',
    borderRadius: radii.full,
    padding: 4,
    backgroundColor: palette.greenLight,
    ...shadows.sm,
    marginBottom: spacing.xs,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
  },
  title: {
    ...fonts.xl,
    ...fonts.bold,
    textAlign: 'center',
    color: palette.gray800,
  },
  subtitle: {
    ...fonts.sm,
    textAlign: 'center',
    color: palette.gray500,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.redLight,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  errorText: {
    ...fonts.sm,
    color: palette.red,
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
    color: palette.gray500,
  },
  footerLink: {
    ...fonts.sm,
    ...fonts.bold,
    color: palette.green,
  },
});
