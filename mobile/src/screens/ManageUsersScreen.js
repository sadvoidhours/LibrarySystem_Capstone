import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
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

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'student', label: 'Students' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'staff', label: 'Staff' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

const ROLE_OPTIONS = ['student', 'faculty', 'admin', 'superadmin'];

const statusLabel = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

const roleLabel = {
  student: 'Student',
  faculty: 'Faculty',
  admin: 'Admin',
  superadmin: 'Superadmin',
};

export default function ManageUsersScreen() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('student');
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState('newest');
  const [banner, setBanner] = useState(null);

  const activeFilter = useMemo(() => FILTERS.find((item) => item.key === filter) || FILTERS[0], [filter]);
  const stats = useMemo(
    () => ({
      pending: users.filter((u) => u.verificationStatus === 'pending').length,
      staff: users.filter((u) => ['admin', 'superadmin'].includes(u.role)).length,
      learners: users.filter((u) => ['student', 'faculty'].includes(u.role)).length,
    }),
    [users]
  );

  const loadUsers = async ({ nextPage = 1, append = false } = {}) => {
    try {
      setLoading(!append);
      const params = { page: nextPage, limit: 12 };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filter === 'staff') {
        params.role = 'staff';
      } else if (filter === 'pending' || filter === 'verified' || filter === 'rejected') {
        params.verificationStatus = filter;
      } else if (filter !== 'all') {
        params.role = filter;
      }

      if (sort) {
        params.sort = sort;
      }

      const { data } = await api.get('/superadmin/users', { params });
      setUsers((current) => (append ? [...current, ...data.items] : data.items));
      setPage(data.page);
      setTotal(data.total);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers({ nextPage: 1, append: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filter, sort]);

  const refresh = async () => {
    setRefreshing(true);
    await loadUsers({ nextPage: 1, append: false });
  };

  const loadMore = () => {
    if (loading) {
      return;
    }

    if (users.length >= total) {
      return;
    }

    loadUsers({ nextPage: page + 1, append: true });
  };

  const openActions = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
  };

  const closeActions = () => {
    setSelectedUser(null);
  };

  const updateRole = async (role) => {
    if (!selectedUser) {
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/superadmin/users/${selectedUser._id}/role`, { role });
      setBanner({ tone: 'success', text: `${selectedUser.name}'s role was updated to ${roleLabel[role] || role}.` });
      closeActions();
      await loadUsers({ nextPage: 1, append: false });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to update role');
    } finally {
      setSaving(false);
    }
  };

  const verifyUser = async (user = selectedUser) => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.patch(`/users/${user._id}/verify`);
      setBanner({
        tone: 'success',
        text: data.emailSent
          ? `${user.name} was verified and the email was sent through Mailtrap.`
          : `${user.name} was verified, but the email could not be sent.`,
      });
      closeActions();
      await loadUsers({ nextPage: 1, append: false });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to verify user');
    } finally {
      setSaving(false);
    }
  };

  const rejectUser = async (user = selectedUser) => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.patch(`/users/${user._id}/reject`);
      setBanner({
        tone: 'warning',
        text: data.emailSent
          ? `${user.name}'s registration was rejected and a notice was sent.`
          : `${user.name}'s registration was rejected, but the notice could not be sent.`,
      });
      closeActions();
      await loadUsers({ nextPage: 1, append: false });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to reject user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = () => {
    if (!selectedUser) {
      return;
    }

    Alert.alert(
      'Delete user',
      `Remove ${selectedUser.name} from the system? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await api.delete(`/superadmin/users/${selectedUser._id}`);
              closeActions();
              await loadUsers({ nextPage: 1, append: false });
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Unable to delete user');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }) => {
    const isPending = item.verificationStatus === 'pending' && ['student', 'faculty'].includes(item.role);

    return (
      <Card style={styles.userCard}>
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: palette.greenLight }]}>
            <Text style={[styles.avatarText, { color: palette.chestnut }]}>{(item.name || '?')[0]?.toUpperCase()}</Text>
          </View>

          <View style={styles.userMeta}>
            <Text style={[styles.userName, { color: palette.gray800 }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.userEmail, { color: palette.gray500 }]} numberOfLines={1}>
              {item.email}
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: palette.greenLight }]}>
                <Text style={[styles.tagText, { color: palette.green }]}>{roleLabel[item.role] || item.role}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: palette.gray100 }]}>
                <Text style={[styles.tagText, { color: palette.gray600 }]}>
                  {statusLabel[item.verificationStatus] || item.verificationStatus}
                </Text>
              </View>
            </View>
            <Text style={[styles.userMetaLine, { color: palette.gray500 }]}>
              ID: {item.studentIdNumber || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <StyledButton
            title="Actions"
            variant="outlineGreen"
            small
            onPress={() => openActions(item)}
            style={styles.flexAction}
          />
          {isPending ? (
            <>
              <StyledButton
                title="Verify"
                variant="success"
                small
                onPress={() => verifyUser(item)}
                style={styles.flexAction}
              />
              <StyledButton
                title="Reject"
                variant="danger"
                small
                onPress={() => rejectUser(item)}
                style={styles.flexAction}
              />
            </>
          ) : null}
        </View>
      </Card>
    );
  };

  const header = (
    <View style={styles.headerBlock}>
      <BrandHeader title="Accounts & Approvals" subtitle="Search, approve, edit roles, and remove accounts" />

      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={[styles.heroIconWrap, { backgroundColor: palette.greenLight }]}>
            <Ionicons name="people-outline" size={24} color={palette.chestnut} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: palette.green }]}>Combined workspace</Text>
            <Text style={[styles.heroTitle, { color: palette.gray800 }]}>Manage every account from one screen</Text>
            <Text style={[styles.heroText, { color: palette.gray500 }]}>Approvals, role changes, search, and deletion now live together for faster admin work.</Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <StyledButton title="Pending approvals" variant="success" small onPress={() => setFilter('pending')} style={styles.heroAction} />
          <StyledButton title="Staff only" variant="outlineGreen" small onPress={() => setFilter('staff')} style={styles.heroAction} />
          <StyledButton title="Reset" variant="outline" small onPress={() => { setFilter('all'); setSort('newest'); setSearch(''); }} style={styles.heroAction} />
        </View>
      </Card>

      {banner ? (
        <Card
          style={[
            styles.bannerCard,
            { backgroundColor: banner.tone === 'warning' ? palette.orangeLight : palette.greenLight, borderColor: banner.tone === 'warning' ? palette.orange : palette.green },
          ]}
        >
          <Text style={[styles.bannerTitle, { color: banner.tone === 'warning' ? palette.orange : palette.green }]}>Action completed</Text>
          <Text style={[styles.bannerText, { color: palette.gray700 }]}>{banner.text}</Text>
        </Card>
      ) : null}

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.chestnut }]}>{total}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Users</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.green }]}>{stats.learners}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Learners</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.blue }]}>{stats.staff}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Staff</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.orange }]}>{stats.pending}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Pending</Text>
          </View>
        </View>
      </Card>

      <StyledInput
        label="Search accounts"
        placeholder="Name, email, or student ID"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? palette.chestnut : palette.surface,
                  borderColor: active ? palette.chestnut : palette.gray200,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? palette.white : palette.gray600 }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
        {SORT_OPTIONS.map((item) => {
          const active = sort === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setSort(item.key)}
              style={[
                styles.sortChip,
                {
                  backgroundColor: active ? palette.green : palette.surface,
                  borderColor: active ? palette.green : palette.gray200,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? palette.white : palette.gray600 }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultRow}>
          <Text style={[styles.resultText, { color: palette.gray500 }]}>Showing {users.length} of {total} accounts {activeFilter.key !== 'all' ? `• ${activeFilter.label}` : ''}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          ListHeaderComponent={header}
          ListEmptyComponent={loading ? null : <EmptyState icon="people-outline" message="No accounts match the current filters." />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={
            loading && users.length > 0 ? (
              <View style={styles.footerLoading}>
                <Text style={[styles.footerText, { color: palette.gray500 }]}>Loading more users...</Text>
              </View>
            ) : null
          }
        />
      </View>

      <Modal visible={Boolean(selectedUser)} transparent animationType="fade" onRequestClose={closeActions}>
        <Pressable style={styles.modalBackdrop} onPress={closeActions}>
          <Pressable
            onPress={() => null}
            style={[
              styles.modalCard,
              { backgroundColor: palette.surface, borderColor: palette.gray100 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalKicker, { color: palette.green }]}>Account Actions</Text>
                <Text style={[styles.modalTitle, { color: palette.gray800 }]}>{selectedUser?.name}</Text>
              </View>
              <Pressable onPress={closeActions} style={styles.closeButton}>
                <Ionicons name="close" size={18} color={palette.gray500} />
              </Pressable>
            </View>

            <Text style={[styles.modalText, { color: palette.gray500 }]} numberOfLines={2}>
              {selectedUser?.email}
            </Text>

            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((role) => {
                const active = selectedRole === role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: active ? palette.chestnut : palette.surfaceAlt,
                        borderColor: active ? palette.chestnut : palette.gray200,
                      },
                    ]}
                  >
                    <Text style={[styles.roleChipText, { color: active ? palette.white : palette.gray700 }]}>
                      {roleLabel[role]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <StyledButton
                title="Save Role"
                variant="success"
                onPress={() => updateRole(selectedRole)}
                loading={saving}
                style={styles.modalButton}
              />
              {selectedUser && ['student', 'faculty'].includes(selectedUser.role) ? (
                <View style={styles.modalSecondaryRow}>
                  <StyledButton
                    title="Verify"
                    variant="outlineGreen"
                    onPress={() => verifyUser(selectedUser)}
                    loading={saving}
                    style={styles.modalButton}
                  />
                  <StyledButton
                    title="Reject"
                    variant="danger"
                    onPress={() => rejectUser(selectedUser)}
                    loading={saving}
                    style={styles.modalButton}
                  />
                </View>
              ) : null}
              <StyledButton
                title="Delete Account"
                variant="danger"
                onPress={deleteUser}
                loading={saving}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  heroCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: 'transparent',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroKicker: {
    ...fonts.xs,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...fonts.lg,
    ...fonts.bold,
  },
  heroText: {
    ...fonts.sm,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroAction: {
    flexGrow: 1,
    minWidth: 120,
  },
  bannerCard: {
    gap: spacing.xs,
    borderWidth: 1,
  },
  bannerTitle: {
    ...fonts.semibold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bannerText: {
    ...fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryItem: {
    flex: 1,
    minWidth: 72,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    ...fonts.lg,
    ...fonts.bold,
  },
  summaryLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  sortRow: {
    gap: spacing.sm,
    paddingVertical: 2,
    marginTop: -spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterText: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  resultRow: {
    marginTop: -2,
  },
  resultText: {
    ...fonts.xs,
  },
  userCard: {
    gap: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  avatarText: {
    ...fonts.md,
    ...fonts.bold,
  },
  userMeta: {
    flex: 1,
    gap: 4,
  },
  userName: {
    ...fonts.base,
    ...fonts.bold,
  },
  userEmail: {
    ...fonts.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  tagText: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  userMetaLine: {
    ...fonts.xs,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flexAction: {
    flexGrow: 1,
    minWidth: 92,
  },
  footerLoading: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    ...fonts.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: spacing.lg,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalKicker: {
    ...fonts.xs,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalTitle: {
    ...fonts.lg,
    ...fonts.bold,
    marginTop: 2,
  },
  modalText: {
    ...fonts.sm,
    lineHeight: 20,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  roleChipText: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  modalActions: {
    gap: spacing.sm,
  },
  modalSecondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
