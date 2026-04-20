import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from '../components/Icon';
import { useSelector } from 'react-redux';
import api from '../api/client';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import StyledInput from '../components/StyledInput';
import { baseStyles, fonts, getThemePalette, radii, spacing } from '../theme/colors';

const ACTOR_FILTERS = [
  { key: 'all', label: 'All roles' },
  { key: 'admin', label: 'Admin' },
  { key: 'superadmin', label: 'Superadmin' },
  { key: 'student', label: 'Student' },
  { key: 'faculty', label: 'Faculty' },
];

const RANGE_FILTERS = [
  { key: 'all', label: 'All time' },
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
];

export default function AuditLogsScreen() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actorRole, setActorRole] = useState('all');
  const [range, setRange] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = async ({ nextPage = 1, append = false } = {}) => {
    try {
      setLoading(!append);
      const params = { page: nextPage, limit: 15 };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (actorRole !== 'all') {
        params.actorRole = actorRole;
      }

      if (range !== 'all') {
        params.range = range;
      }

      const { data } = await api.get('/superadmin/audit-logs', { params });
      setLogs((current) => (append ? [...current, ...data.items] : data.items));
      setPage(data.page);
      setTotal(data.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs({ nextPage: 1, append: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, actorRole, range]);

  const refresh = async () => {
    setRefreshing(true);
    await loadLogs({ nextPage: 1, append: false });
  };

  const loadMore = () => {
    if (loading || logs.length >= total) {
      return;
    }

    loadLogs({ nextPage: page + 1, append: true });
  };

  const renderItem = ({ item }) => (
    <Card style={styles.logCard}>
      <View style={styles.logRow}>
        <View style={[styles.iconWrap, { backgroundColor: palette.olive + '18' }]}>
          <Icon name="document-text" size={18} color={palette.olive} />
        </View>
        <View style={styles.logBody}>
          <Text style={[styles.action, { color: palette.gray800 }]} numberOfLines={2}>
            {item.action}
          </Text>
          <Text style={[styles.meta, { color: palette.gray500 }]} numberOfLines={1}>
            {item.actorId?.name || item.actorId?.email || item.actorRole || 'System'}
          </Text>
          <View style={styles.tagRow}>
            <View style={[styles.roleTag, { backgroundColor: palette.gray100 }]}>
              <Text style={[styles.roleText, { color: palette.gray600 }]}>{item.actorRole}</Text>
            </View>
            <View style={[styles.roleTag, { backgroundColor: palette.greenLight }]}>
              <Text style={[styles.roleText, { color: palette.green }]}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );

  const header = (
    <View style={styles.headerBlock}>
      <BrandHeader title="Audit Logs" subtitle="Search and filter administrative activity" />

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.chestnut }]}>{total}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Records</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.green }]}>{logs.filter((item) => item.actorRole === 'admin').length}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Admin</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: palette.blue }]}>{logs.filter((item) => item.actorRole === 'superadmin').length}</Text>
            <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Superadmin</Text>
          </View>
        </View>
      </Card>

      <StyledInput
        label="Search logs"
        placeholder="Action, role, or keyword"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: palette.gray700 }]}>Actor role</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {ACTOR_FILTERS.map((item) => {
            const active = actorRole === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setActorRole(item.key)}
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
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: palette.gray700 }]}>Time range</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {RANGE_FILTERS.map((item) => {
            const active = range === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setRange(item.key)}
                style={[
                  styles.filterChip,
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
      </View>

      <Text style={[styles.resultText, { color: palette.gray500 }]}>Showing {logs.length} of {total} log entries</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={loading ? null : <EmptyState icon="document-text-outline" message="No audit logs match the current filters." />}
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
  filterSection: { gap: spacing.sm },
  filterLabel: { ...fonts.sm, ...fonts.semibold },
  filterRow: { gap: spacing.sm, paddingVertical: 2 },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.full, borderWidth: 1 },
  filterText: { ...fonts.sm, ...fonts.semibold },
  resultText: { ...fonts.xs },
  logCard: { padding: spacing.md },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBody: { flex: 1, gap: 4 },
  action: { ...fonts.base, ...fonts.bold },
  meta: { ...fonts.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleTag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  roleText: { ...fonts.xs, ...fonts.semibold },
});
