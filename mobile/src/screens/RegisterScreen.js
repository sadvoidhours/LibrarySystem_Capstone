import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../components/Icon';
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
  const p = palette; // pre-auth always light
  const [localError, setLocalError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', studentIdNumber: '', password: '', role: 'student' });

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
      phone: form.phone.trim(),
      studentIdNumber: form.studentIdNumber.trim(),
      password: form.password,
      role: form.role,
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
        contentContainerStyle={[styles.scroll, { backgroundColor: p.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, baseStyles.webCenter]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Landing')}>
            <Icon name="arrow-back" size={18} color={p.green} />
            <Text style={[styles.backText, { color: p.green }]}>Back to Home</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.logoWrap, { backgroundColor: p.greenLight }]}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} />
            </View>
            <View style={[styles.badge, { backgroundColor: p.greenLight }]}>
              <Text style={[styles.badgeText, { color: p.green }]}>Create your account</Text>
            </View>
            <Text style={[styles.title, { color: p.gray800 }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: p.gray500 }]}>Student / Faculty Registration</Text>
          </View>

          <Card style={styles.form}>
            <StyledInput label="Full Name" placeholder="Juan dela Cruz" value={form.name} onChangeText={(v) => update('name', v)} />
            <StyledInput label="Email" placeholder="jabellino@paterostechnologicalcollege.edu.ph" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => update('email', v)} />
            <StyledInput label="Mobile Number" placeholder="09XXXXXXXXX" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} />
            <StyledInput label="Student ID Number" placeholder="20XX-XXXXX" value={form.studentIdNumber} onChangeText={(v) => update('studentIdNumber', v)} />
            <StyledInput label="Password" placeholder="Min. 6 characters" secureTextEntry value={form.password} onChangeText={(v) => update('password', v)} />

            <View style={styles.roleRow}>
              <Text style={[styles.roleLabel, { color: p.gray600 }]}>I am a:</Text>
              <View style={styles.roleOptions}>
                {['student', 'faculty'].map((r) => (
                  <Pressable key={r} onPress={() => update('role', r)}>
                    <View style={[styles.roleChip, { backgroundColor: form.role === r ? p.green : p.surface, borderColor: form.role === r ? p.green : p.gray200 }]}>
                      <Text style={[styles.roleChipText, { color: form.role === r ? p.white : p.gray600 }]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {displayError ? (
              <View style={[styles.errorBox, { backgroundColor: p.redLight }]}>
                <Icon name="alert-circle" size={16} color={p.red} />
                <Text style={[styles.errorText, { color: p.red }]}>{displayError}</Text>
              </View>
            ) : null}

            {registerMessage ? (
              <View style={[styles.successBox, { backgroundColor: p.greenLight }]}>
                <Icon name="checkmark-circle" size={16} color={p.green} />
                <Text style={[styles.successText, { color: p.green }]}>{registerMessage}</Text>
              </View>
            ) : null}

            <StyledButton title="Submit Registration" variant="success" onPress={submit} loading={loading} />
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerLabel, { color: p.gray500 }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => { dispatch(clearAuthFeedback()); navigation.navigate('Login'); }}>
              <Text style={[styles.footerLink, { color: p.green }]}>{registerMessage ? 'Go to Login' : 'Sign In'}</Text>
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
  roleRow: {
    gap: spacing.sm,
  },
  roleLabel: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  roleChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  roleChipText: {
    ...fonts.sm,
    ...fonts.semibold,
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  successText: {
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
