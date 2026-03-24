import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api from '../api/client';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { baseStyles, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';

const ROLE_CHOICES = [
  { key: 'admin', label: 'Admin' },
  { key: 'superadmin', label: 'Superadmin' },
];

export default function ManageAdminsScreen() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [creating, setCreating] = useState(false);

  const loadAdmins = async ({ nextPage = 1, append = false } = {}) => {
    try {
      setLoading(!append);
      const params = { page: nextPage, limit: 12, role: 'staff' };

      if (search.trim()) {
        params.search = search.trim();
      }

      const { data } = await api.get('/superadmin/users', { params });
      setAdmins((current) => (append ? [...current, ...data.items] : data.items));
      setPage(data.page);
      setTotal(data.total);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to load staff accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdmins({ nextPage: 1, append: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAdmins({ nextPage: 1, append: false });
  };

  const loadMore = () => {
    if (loading || admins.length >= total) {
      return;
    }

    loadAdmins({ nextPage: page + 1, append: true });
  };

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const createAdmin = async () => {
    try {
      setCreating(true);
      await api.post('/superadmin/admins', form);
      Alert.alert('Success', `${form.role === 'superadmin' ? 'Superadmin' : 'Admin'} account created`);
      setForm({ name: '', email: '', password: '', role: 'admin' });
      await loadAdmins({ nextPage: 1, append: false });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to create admin');
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (user, role) => {
    try {
      await api.patch(`/superadmin/users/${user._id}/role`, { role });
      await loadAdmins({ nextPage: 1, append: false });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to update role');
    }
  };

  const deleteUser = (user) => {
    Alert.alert('Delete account', `Remove ${user.name} from staff accounts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/superadmin/users/${user._id}`);
            await loadAdmins({ nextPage: 1, append: false });
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Unable to delete account');
          }
        },
      },
    ]);
  };

  const renderAdmin = ({ item }) => {
    const canPromote = item.role === 'admin';
    const canDemote = item.role === 'superadmin';

    return (
      <Card style={styles.staffCard}>
        <View style={styles.staffRow}>
          <View style={[styles.avatar, { backgroundColor: palette.greenLight }]}>
            <Ionicons name="people-outline" size={22} color={palette.chestnut} />
          </View>
          <View style={styles.staffMeta}>
            <Text style={[styles.staffName, { color: palette.gray800 }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.staffEmail, { color: palette.gray500 }]} numberOfLines={1}>
              {item.email}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: palette.greenLight }]}>
                <Text style={[styles.badgeText, { color: palette.green }]}>
                  {item.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: palette.gray100 }]}>
                <Text style={[styles.badgeText, { color: palette.gray600 }]}>
                  {item.isVerified ? 'Verified' : item.verificationStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          {canPromote ? (
            <StyledButton
              title="Promote"
              variant="success"
              small
              onPress={() => updateRole(item, 'superadmin')}
              style={styles.actionButton}
            />
          ) : null}
          {canDemote ? (
            <StyledButton
              title="Demote"
              variant="outlineGreen"
              small
              onPress={() => updateRole(item, 'admin')}
              style={styles.actionButton}
            />
          ) : null}
          <StyledButton
            title="Delete"
            variant="danger"
            small
            onPress={() => deleteUser(item)}
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  const header = (
    <View style={styles.headerBlock}>
      <BrandHeader title="Staff Management" subtitle="Create, search, promote, and remove admin accounts" />

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.chestnut }]}>{total}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Staff</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.green }]}>{admins.filter((item) => item.role === 'admin').length}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Admins</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.blue }]}>{admins.filter((item) => item.role === 'superadmin').length}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Superadmins</Text>
          </View>
        </View>
      </Card>

      <StyledInput
        label="Search staff"
        placeholder="Name or email"
        value={search}
        onChangeText={setSearch}
      />

      <Card style={styles.formCard}>
        <View style={styles.formHeader}>
          <View>
            <Text style={[styles.formKicker, { color: palette.green }]}>Create account</Text>
            <Text style={[styles.formTitle, { color: palette.gray800 }]}>New admin or superadmin</Text>
          </View>
          <Ionicons name="person-add-outline" size={22} color={palette.chestnut} />
        </View>

        <View style={styles.formGrid}>
          <StyledInput
            label="Full Name"
            placeholder="Admin name"
            value={form.name}
            onChangeText={(value) => updateForm('name', value)}
          />
          <StyledInput
            label="Email"
            placeholder="admin@ptc.edu.ph"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) => updateForm('email', value)}
          />
          <StyledInput
            label="Password"
            placeholder="Secure password"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => updateForm('password', value)}
          />
          <View style={styles.roleChooser}>
            <Text style={[styles.roleChooserLabel, { color: palette.gray700 }]}>Role</Text>
            <View style={styles.roleRow}>
              {ROLE_CHOICES.map((role) => {
                const active = form.role === role.key;
                return (
                  <Pressable
                    key={role.key}
                    onPress={() => updateForm('role', role.key)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: active ? palette.chestnut : palette.surfaceAlt,
                        borderColor: active ? palette.chestnut : palette.gray200,
                      },
                    ]}
                  >
                    <Text style={[styles.roleChipText, { color: active ? palette.white : palette.gray700 }]}>
                      {role.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <StyledButton
            title="Create Account"
            onPress={createAdmin}
            loading={creating}
            variant="success"
          />
        </View>
      </Card>

      <View style={styles.resultRow}>
        <Text style={[styles.resultText, { color: palette.gray500 }]}>Showing {admins.length} of {total} staff accounts</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <FlatList
          data={admins}
          keyExtractor={(item) => item._id}
          renderItem={renderAdmin}
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? null : <EmptyState icon="people-outline" message="No admin accounts found." />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
  listContent: { gap: spacing.md, paddingBottom: spacing.xl },
  headerBlock: { gap: spacing.md, marginBottom: spacing.sm },
  summaryCard: { padding: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { ...fonts.lg, ...fonts.bold },
  summaryLabel: { ...fonts.xs, ...fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  formCard: { gap: spacing.md },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' },
  formKicker: { ...fonts.xs, ...fonts.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  formTitle: { ...fonts.lg, ...fonts.bold, marginTop: 2 },
  formGrid: { gap: spacing.md },
  roleChooser: { gap: spacing.sm },
  roleChooserLabel: { ...fonts.sm, ...fonts.semibold },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.full, borderWidth: 1 },
  roleChipText: { ...fonts.sm, ...fonts.semibold },
  resultRow: { marginTop: -2 },
  resultText: { ...fonts.xs },
  staffCard: { gap: spacing.md },
  staffRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  staffMeta: { flex: 1, gap: 4 },
  staffName: { ...fonts.base, ...fonts.bold },
  staffEmail: { ...fonts.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  badgeText: { ...fonts.xs, ...fonts.semibold },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: { flexGrow: 1, minWidth: 88 },
});
