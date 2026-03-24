import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthFeedback, register } from '../store/slices/authSlice';
import { baseStyles, fonts, palette, radii, shadows, spacing } from '../theme/colors';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';

const PTC_EMAIL_REGEX = /^[a-z]+@paterostechnologicalcollege\.edu\.ph$/;

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error, registerMessage } = useSelector((state) => state.auth);
  const [localError, setLocalError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', studentIdNumber: '', password: '' });

  const clearErrors = () => {
    if (localError) setLocalError('');
    if (error || registerMessage) dispatch(clearAuthFeedback());
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearErrors();
  };

  const submit = () => {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      studentIdNumber: form.studentIdNumber.trim(),
      password: form.password,
    };
    if (!payload.name || !payload.email || !payload.studentIdNumber || !payload.password) {
      setLocalError('All fields are required.');
      return;
    }
    if (!PTC_EMAIL_REGEX.test(payload.email)) {
      setLocalError('Use initials+lastname@paterostechnologicalcollege.edu.ph');
      return;
    }
    if (payload.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    setLocalError('');
    dispatch(register(payload));
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
              <Text style={styles.badgeText}>Create your account</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Student / Faculty Registration</Text>
          </View>

          {/* Form Card */}
          <Card style={styles.form}>
            <StyledInput label="Full Name" placeholder="Juan dela Cruz" value={form.name} onChangeText={(v) => update('name', v)} />
            <StyledInput label="Email" placeholder="jabellino@paterostechnologicalcollege.edu.ph" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => update('email', v)} />
            <StyledInput label="Student ID Number" placeholder="20XX-XXXXX" value={form.studentIdNumber} onChangeText={(v) => update('studentIdNumber', v)} />
            <StyledInput label="Password" placeholder="Min. 6 characters" secureTextEntry value={form.password} onChangeText={(v) => update('password', v)} />

            {displayError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={palette.red} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {registerMessage ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color={palette.green} />
                <Text style={styles.successText}>{registerMessage}</Text>
              </View>
            ) : null}

            <StyledButton title="Submit Registration" variant="success" onPress={submit} loading={loading} />
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Already have an account?</Text>
            <TouchableOpacity onPress={() => { dispatch(clearAuthFeedback()); navigation.navigate('Login'); }}>
              <Text style={styles.footerLink}>{registerMessage ? 'Go to Login' : 'Sign In'}</Text>
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.greenLight,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  successText: {
    ...fonts.sm,
    color: palette.green,
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
