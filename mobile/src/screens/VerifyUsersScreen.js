import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { baseStyles, fonts, palette, radii, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StyledButton from '../components/StyledButton';
import EmptyState from '../components/EmptyState';

export default function VerifyUsersScreen() {
  const [items, setItems] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  const loadPending = async () => {
    const { data } = await api.get('/users/pending-verification');
    setItems(data);
  };

  useEffect(() => {
    loadPending().catch(() => null);
  }, []);

  const approve = async (id) => {
    try {
      setLoadingId(id);
      await api.patch(`/users/${id}/verify`);
      await loadPending();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify user');
    } finally {
      setLoadingId(null);
    }
  };

  const reject = async (id) => {
    try {
      setLoadingId(id);
      await api.patch(`/users/${id}/reject`);
      await loadPending();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject user');
    } finally {
      setLoadingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.infoWrap}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.email}</Text>
          <Text style={styles.meta}>ID: {item.studentIdNumber || '-'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <StyledButton
          title="Verify"
          variant="success"
          small
          style={{ flex: 1 }}
          loading={loadingId === item._id}
          onPress={() => approve(item._id)}
        />
        <StyledButton
          title="Reject"
          variant="danger"
          small
          style={{ flex: 1 }}
          loading={loadingId === item._id}
          onPress={() => reject(item._id)}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Registration Approvals" subtitle="Admin verification for student/faculty accounts" />
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="checkmark-done-circle-outline" message="No pending registrations." />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { flex: 1, padding: spacing.lg },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  card: { padding: spacing.md, gap: spacing.md },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: palette.chestnut + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...fonts.md, ...fonts.bold, color: palette.chestnut },
  infoWrap: { flex: 1, gap: 2 },
  name: { ...fonts.base, ...fonts.bold, color: palette.gray800 },
  meta: { ...fonts.sm, color: palette.gray500 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
