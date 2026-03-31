import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { logout, changePassword, updateProfile } from '../store/slices/authSlice';
import { getThemePalette, radii, spacing, fonts, shadows, baseStyles } from '../theme/colors';

const THEME_OPTIONS = {
  light: {
    icon: 'sunny-outline',
    title: 'Light mode',
    subtitle: 'Bright, high-contrast presentation for daytime use.',
  },
  dark: {
    icon: 'moon-outline',
    title: 'Dark mode',
    subtitle: 'Reduce glare with a softer library dashboard at night.',
  },
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

const createStyles = (palette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scroll: {
      paddingBottom: spacing.xxl,
    },
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    headerCard: {
      backgroundColor: palette.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: palette.gray100,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadows.sm,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    avatarWrap: {
      width: 76,
      height: 76,
      borderRadius: radii.full,
      overflow: 'hidden',
      backgroundColor: palette.greenLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.gray100,
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    initials: {
      ...fonts.xl,
      ...fonts.bold,
      color: palette.green,
    },
    profileText: {
      flex: 1,
      gap: 4,
    },
    name: {
      ...fonts.lg,
      ...fonts.bold,
      color: palette.gray800,
    },
    email: {
      ...fonts.sm,
      color: palette.gray500,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radii.full,
      backgroundColor: palette.greenLight,
    },
    roleText: {
      ...fonts.xs,
      ...fonts.semibold,
      color: palette.green,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionButton: {
      minWidth: 160,
      flexGrow: 1,
    },
    sectionGrid: {
      gap: spacing.lg,
    },
    sectionCard: {
      gap: spacing.lg,
    },
    sectionHeader: {
      gap: 4,
    },
    sectionKicker: {
      ...fonts.xs,
      ...fonts.semibold,
      color: palette.green,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    sectionTitle: {
      ...fonts.lg,
      ...fonts.bold,
      color: palette.gray800,
    },
    sectionText: {
      ...fonts.sm,
      color: palette.gray500,
      lineHeight: 20,
    },
    noteBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: palette.greenLight,
      borderWidth: 1,
      borderColor: palette.greenPastel,
    },
    noteBody: {
      flex: 1,
      gap: 2,
    },
    noteTitle: {
      ...fonts.base,
      ...fonts.bold,
      color: palette.gray800,
    },
    noteText: {
      ...fonts.sm,
      color: palette.gray600,
      lineHeight: 20,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.lg,
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: palette.surfaceAlt,
      borderWidth: 1,
      borderColor: palette.gray100,
    },
    themeInfo: {
      flex: 1,
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center',
    },
    themeIcon: {
      width: 42,
      height: 42,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.gray100,
    },
    themeCopy: {
      flex: 1,
      gap: 2,
    },
    themeTitle: {
      ...fonts.base,
      ...fonts.semibold,
      color: palette.gray800,
    },
    themeSubtitle: {
      ...fonts.xs,
      color: palette.gray500,
      lineHeight: 18,
    },
    formGrid: {
      gap: spacing.md,
    },
    passwordRow: {
      flexDirection: 'row',
      gap: spacing.md,
      flexWrap: 'wrap',
    },
    passwordField: {
      flexGrow: 1,
      minWidth: 180,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    helperText: {
      ...fonts.xs,
      color: palette.gray500,
      flex: 1,
    },
    message: {
      ...fonts.sm,
      color: palette.green,
      lineHeight: 20,
    },
    error: {
      ...fonts.sm,
      color: palette.red,
      lineHeight: 20,
    },
    savingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    wideLayout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.lg,
    },
    wideColumn: {
      flex: 1,
    },
  });

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const themeMode = user?.themePreference || 'light';
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const [fullName, setFullName] = useState(user?.name || '');
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || '');
  const [darkMode, setDarkMode] = useState(themeMode === 'dark');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState(user?.profileImageUrl || '');

  const profileMode = darkMode ? 'dark' : 'light';
  const theme = THEME_OPTIONS[profileMode];

  const saveProfile = async () => {
    setStatusMessage('');
    setErrorMessage('');

    try {
      setProfileSaving(true);
      await dispatch(
        updateProfile({
          name: fullName.trim(),
          phone: mobileNumber.trim(),
          profileImageUrl,
          themePreference: profileMode,
        })
      ).unwrap();
      setStatusMessage('Profile preferences saved.');
    } catch (error) {
      setErrorMessage(error || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleThemeToggle = async (nextValue) => {
    setDarkMode(nextValue);
    setStatusMessage('');
    setErrorMessage('');

    try {
      await dispatch(
        updateProfile({
          name: fullName.trim(),
          phone: mobileNumber.trim(),
          profileImageUrl,
          themePreference: nextValue ? 'dark' : 'light',
        })
      ).unwrap();
    } catch (error) {
      setDarkMode(!nextValue);
      setErrorMessage(error || 'Unable to update theme preference.');
    }
  };

  const uploadProfileImage = async ({ uri, name, type, file }) => {
    setAvatarPreviewUri(uri);
    setPhotoLoading(true);

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const webFile = file || await fetch(uri).then((response) => response.blob());
        const fileObject = webFile instanceof File ? webFile : new File([webFile], name, { type });
        formData.append('image', fileObject, name);
      } else {
        formData.append('image', {
          uri,
          name,
          type,
        });
      }

      const { data } = await api.post('/uploads/image?folder=ptc-library/profile-pictures', formData);

      setProfileImageUrl(data.url);
      setAvatarPreviewUri(data.url);
      await dispatch(
        updateProfile({
          name: fullName.trim(),
          phone: mobileNumber.trim(),
          profileImageUrl: data.url,
          themePreference: profileMode,
        })
      ).unwrap();
      setStatusMessage('Profile photo updated.');
    } catch (error) {
      setAvatarPreviewUri(profileImageUrl || user?.profileImageUrl || '');
      setErrorMessage(error?.response?.data?.message || 'Unable to upload photo.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const choosePhoto = async () => {
    setStatusMessage('');
    setErrorMessage('');

    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
          const selectedFile = event.target.files?.[0];
          if (!selectedFile) {
            return;
          }

          const fileName = selectedFile.name || `profile-${Date.now()}.jpg`;
          await uploadProfileImage({
            uri: URL.createObjectURL(selectedFile),
            name: fileName,
            type: selectedFile.type || 'image/jpeg',
            file: selectedFile,
          });
        };

        input.click();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        return;
      }

      const filename = asset.fileName || `profile-${Date.now()}.jpg`;
      const extensionMatch = filename.match(/\.(\w+)$/);
      const fileType = asset.mimeType || `image/${extensionMatch ? extensionMatch[1] : 'jpeg'}`;
      await uploadProfileImage({ uri: asset.uri, name: filename, type: fileType, file: asset.file });
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to upload photo.');
    } finally {
      if (Platform.OS === 'web') {
        // keep browser upload state controlled by the file input callback
      }
    }
  };

  const submitPassword = async () => {
    setStatusMessage('');
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      await dispatch(
        changePassword({
          currentPassword,
          newPassword,
        })
      ).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage('Password updated successfully.');
    } catch (error) {
      setErrorMessage(error || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const deleteAccount = async () => {
    Alert.alert(
      'Delete account',
      'This will permanently remove your account and sign you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me');
              dispatch(logout());
            } catch (error) {
              setErrorMessage(error?.response?.data?.message || 'Unable to delete account.');
            }
          },
        },
      ]
    );
  };

  const avatar = avatarPreviewUri ? (
    <Image source={{ uri: avatarPreviewUri }} style={styles.avatar} />
  ) : (
    <Text style={styles.initials}>{getInitials(fullName || user?.name)}</Text>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Settings" subtitle="Update your account, appearance, and security" />

        <View style={styles.headerCard}>
          <View style={styles.profileRow}>
            <Pressable onPress={choosePhoto} disabled={photoLoading} style={styles.avatarWrap}>
              {photoLoading ? <ActivityIndicator color={palette.green} /> : avatar}
            </Pressable>
            <View style={styles.profileText}>
              <Text style={styles.name}>{fullName || user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="id-card-outline" size={14} color={palette.green} />
                <Text style={styles.roleText}>{user?.role ? `${user.role} account` : 'Account'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <StyledButton
              title={photoLoading ? 'Uploading...' : 'Change Photo'}
              variant="outlineGreen"
              onPress={choosePhoto}
              disabled={photoLoading}
              icon={photoLoading ? <ActivityIndicator size="small" color={palette.green} /> : <Ionicons name="image-outline" size={16} color={palette.green} />}
              style={styles.actionButton}
            />
            <StyledButton
              title={profileSaving ? 'Saving...' : 'Save Profile'}
              variant="success"
              onPress={saveProfile}
              loading={profileSaving}
              style={styles.actionButton}
            />
          </View>
        </View>

        <View style={isWide ? styles.wideLayout : styles.sectionGrid}>
          <View style={isWide ? styles.wideColumn : null}>
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionKicker}>Profile</Text>
                <Text style={styles.sectionTitle}>Edit your display name</Text>
                <Text style={styles.sectionText}>
                  Keep your name and profile image current so your account is easier to identify.
                </Text>
              </View>

              <View style={styles.formGrid}>
                <StyledInput label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
                <StyledInput label="Mobile number" value={mobileNumber} onChangeText={setMobileNumber} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
                <StyledInput
                  label="Profile image URL"
                  value={profileImageUrl}
                  onChangeText={setProfileImageUrl}
                  placeholder="https://..."
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.noteBox}>
                  <Ionicons name="cloud-upload-outline" size={18} color={palette.green} />
                  <View style={styles.noteBody}>
                    <Text style={styles.noteTitle}>Upload or paste a link</Text>
                    <Text style={styles.noteText}>
                      Use the photo picker for a local upload, or paste an image URL if the image is already hosted online.
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>

          <View style={isWide ? styles.wideColumn : null}>
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionKicker}>Appearance</Text>
                <Text style={styles.sectionTitle}>Dark mode preference</Text>
                <Text style={styles.sectionText}>
                  Landing remains light by default. Your account theme applies once you sign in.
                </Text>
              </View>

              <View style={styles.themeRow}>
                <View style={styles.themeInfo}>
                  <View style={styles.themeIcon}>
                    <Ionicons name={theme.icon} size={18} color={palette.green} />
                  </View>
                  <View style={styles.themeCopy}>
                    <Text style={styles.themeTitle}>{theme.title}</Text>
                    <Text style={styles.themeSubtitle}>{theme.subtitle}</Text>
                  </View>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: palette.gray200, true: palette.greenMint }}
                  thumbColor={darkMode ? palette.green : palette.white}
                />
              </View>
            </Card>
          </View>
        </View>

        <Card style={[styles.sectionCard, { marginTop: spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>Security</Text>
            <Text style={styles.sectionTitle}>Change your password</Text>
            <Text style={styles.sectionText}>
              Use a strong password you do not reuse anywhere else.
            </Text>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.passwordRow}>
              <View style={styles.passwordField}>
                <StyledInput
                  label="Current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Current password"
                />
              </View>
              <View style={styles.passwordField}>
                <StyledInput
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="New password"
                />
              </View>
              <View style={styles.passwordField}>
                <StyledInput
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Repeat new password"
                />
              </View>
            </View>

            <StyledButton
              title={passwordSaving ? 'Updating...' : 'Update Password'}
              variant="primary"
              onPress={submitPassword}
              loading={passwordSaving}
            />
          </View>
        </Card>

        {statusMessage ? (
          <View style={[styles.helperRow, { marginTop: spacing.md }]}>
            <Ionicons name="checkmark-circle" size={16} color={palette.green} />
            <Text style={styles.message}>{statusMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={[styles.helperRow, { marginTop: spacing.md }]}>
            <Ionicons name="alert-circle" size={16} color={palette.red} />
            <Text style={styles.error}>{errorMessage}</Text>
          </View>
        ) : null}

        <Card style={[styles.sectionCard, { marginTop: spacing.lg, backgroundColor: palette.redLight, borderColor: palette.redLight }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionKicker, { color: palette.red }]}>Danger zone</Text>
            <Text style={styles.sectionTitle}>Delete your account</Text>
            <Text style={styles.sectionText}>
              This removes your personal account permanently. Staff accounts are archived by administrators instead.
            </Text>
          </View>
          <StyledButton title="Delete My Account" variant="danger" onPress={deleteAccount} />
        </Card>
      </View>
    </ScrollView>
  );
}
