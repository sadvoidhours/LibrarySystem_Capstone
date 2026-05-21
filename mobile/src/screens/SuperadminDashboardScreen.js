import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import api from '../api/client';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import CalendarHeatmap from '../components/CalendarHeatmap';
import EmptyState from '../components/EmptyState';
import LineChart from '../components/LineChart';
import MiniBarChart from '../components/MiniBarChart';
import StatCard from '../components/StatCard';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { logout } from '../store/slices/authSlice';
import { baseStyles, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';

const QUICK_ACTIONS = [
  { title: 'Generate report', icon: 'stats-chart', tab: 'Reports', colorKey: 'blue' },
  { title: 'Manage accounts', icon: 'people', tab: 'Accounts', colorKey: 'green' },
  { title: 'Inspect logs', icon: 'document-text', tab: 'Audit Logs', colorKey: 'blue' },
];

const metricCards = [
  { key: 'totalUsers', label: 'Users', icon: 'people' },
  { key: 'staffUsers', label: 'Staff', icon: 'shield-checkmark' },
  { key: 'studentUsers', label: 'Students', icon: 'school' },
  { key: 'facultyUsers', label: 'Faculty', icon: 'person' },
  { key: 'pendingApprovals', label: 'Approvals', icon: 'hourglass' },
  { key: 'totalBooks', label: 'Books', icon: 'library' },
  { key: 'activeBorrowings', label: 'Book Loans', icon: 'book' },
  { key: 'overdueBorrowings', label: 'Overdue', icon: 'alert-circle' },
];

const formatIsoDate = (value) => value.toISOString().slice(0, 10);

const getPresetRange = (preset) => {
  const end = new Date();
  const start = new Date();
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  start.setDate(start.getDate() - (days - 1));
  return { start: formatIsoDate(start), end: formatIsoDate(end) };
};

const buildDailySeries = (rangeStart, rangeEnd, items, palette) => {
  if (!rangeStart || !rangeEnd) {
    return [];
  }

  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const countByKey = new Map(items.map((item) => [item.label, item.count]));
  const result = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = formatIsoDate(cursor);
    const label = key.slice(5).replace('-', '/');
    result.push({ label, value: countByKey.get(key) || 0, color: palette.green });
  }

  return result;
};

const buildHourlySeries = (rangeStart, rangeEnd, items, palette) => {
  if (!rangeStart || !rangeEnd) {
    return [];
  }

  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  start.setMinutes(0, 0, 0);
  end.setMinutes(0, 0, 0);

  const countByKey = new Map(items.map((item) => [item.label, item.count]));
  const result = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setHours(cursor.getHours() + 1)) {
    const key = `${cursor.toISOString().slice(0, 13)}:00`;
    const label = String(cursor.getHours()).padStart(2, '0');
    result.push({ label, value: countByKey.get(key) || 0, color: palette.green });
  }

  return result;
};

const formatWeekLabel = (value) => {
  const parts = String(value || '').split('-W');
  if (parts.length !== 2) return value;
  return `W${parts[1]}`;
};

export default function SuperadminDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isCompact = width < 460;
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState(null);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [rangePreset, setRangePreset] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [rangeError, setRangeError] = useState('');

  const loadOverview = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/superadmin/overview');
      setOverview(data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to load overview');
    } finally {
      setLoading(false);
    }
  };

  const loadGrowth = async (params) => {
    try {
      setGrowthLoading(true);
      const response = await api.get('/superadmin/user-growth', { params });
      setGrowth(response.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to load user growth report');
    } finally {
      setGrowthLoading(false);
    }
  };

  const applyPresetRange = (preset) => {
    setRangePreset(preset);
    setRangeError('');

    if (preset !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const refreshGrowth = () => {
    if (rangePreset === 'custom') {
      applyCustomRange();
      return;
    }

    const nextRange = getPresetRange(rangePreset);
    loadGrowth(nextRange);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) {
      setRangeError('Enter both start and end dates.');
      return;
    }

    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setRangeError('Use YYYY-MM-DD format for dates.');
      return;
    }

    if (startDate > endDate) {
      setRangeError('Start date must be before end date.');
      return;
    }

    setRangeError('');
    loadGrowth({ start: customStart, end: customEnd });
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (rangePreset === 'custom') {
      return;
    }

    const nextRange = getPresetRange(rangePreset);
    loadGrowth(nextRange);
  }, [rangePreset]);

  const recentUsers = overview?.recentUsers || [];
  const recentLogs = overview?.recentAuditLogs || [];
  const profileName = user?.full_name || user?.name || user?.email || 'Account';
  const profileInitial = (profileName[0] || 'A').toUpperCase();
  const chartItems = useMemo(() => ([
    { label: 'Students', value: overview?.studentUsers ?? 0, color: palette.green },
    { label: 'Faculty', value: overview?.facultyUsers ?? 0, color: palette.blue },
    { label: 'Admins', value: overview?.adminUsers ?? 0, color: palette.orange },
    { label: 'Superadmins', value: overview?.superadminUsers ?? 0, color: palette.red },
  ]), [overview, palette]);

  const growthDailyItems = useMemo(() => {
    if (!growth?.range?.start || !growth?.range?.end) {
      return [];
    }

    return buildDailySeries(growth.range.start, growth.range.end, growth.series?.daily || [], palette);
  }, [growth, palette]);

  const growthHourlyItems = useMemo(() => {
    if (!growth?.range?.start || !growth?.range?.end) {
      return [];
    }

    return buildHourlySeries(growth.range.start, growth.range.end, growth.series?.hourly || [], palette);
  }, [growth, palette]);

  const growthWeeklyItems = useMemo(() => {
    return (growth?.series?.weekly || []).map((item) => ({
      label: formatWeekLabel(item.label),
      value: item.count,
      color: palette.blue,
    }));
  }, [growth, palette]);

  const rangeDays = useMemo(() => {
    if (!growth?.range?.start || !growth?.range?.end) {
      return 0;
    }

    const start = new Date(growth.range.start);
    const end = new Date(growth.range.end);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
  }, [growth]);

  const chartVariant = useMemo(() => {
    if (!rangeDays) {
      return 'daily';
    }

    if (rangeDays <= 1) {
      return 'hourly';
    }

    if (rangeDays <= 7) {
      return 'daily';
    }

    if (rangeDays <= 31) {
      return 'calendar';
    }

    return 'weekly';
  }, [rangeDays]);

  const renderMetric = ({ item }) => (
    <Card key={item.key} style={[styles.metricCard, { backgroundColor: palette.surfaceAlt, borderColor: palette.gray100 }]}>
      <View style={styles.metricIcon}>
        <Icon name={item.icon} size={18} color={palette.white} />
      </View>
      <Text style={[styles.metricValue, { color: palette.gray800 }]}>{overview?.[item.key] ?? 0}</Text>
      <Text style={[styles.metricLabel, { color: palette.gray500 }]}>{item.label}</Text>
    </Card>
  );

  const renderQuickAction = (item) => (
    <PressableAction
      key={item.tab}
      title={item.title}
      icon={item.icon}
      color={palette[item.colorKey]}
      onPress={() => navigation.navigate(item.tab)}
    />
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Superadmin Control Center" subtitle="Govern users, staff, and system activity" />

        <Card style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.profileSpotlight}>
              <View style={[styles.profileAvatar, { backgroundColor: palette.chestnut + '14' }]}>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
                ) : (
                  <Text style={[styles.profileInitial, { color: palette.chestnut }]}>{profileInitial}</Text>
                )}
              </View>
              <View style={styles.profileCopy}>
                <Text style={[styles.heroKicker, { color: palette.green }]}>Logged in as superadmin</Text>
                <Text
                  style={[styles.heroTitle, isCompact && styles.compactText, { color: palette.gray800 }]}
                  numberOfLines={isCompact ? 0 : 1}
                  ellipsizeMode="tail"
                >
                  {profileName}
                </Text>
              </View>
            </View>
            <Pressable style={[styles.pulseChip, { backgroundColor: palette.greenLight }]} onPress={loadOverview}>
              <Icon name="refresh" size={16} color={palette.chestnut} />
              <Text style={[styles.pulseText, { color: palette.chestnut }]}>Refresh overview</Text>
            </Pressable>
          </View>

          <View style={styles.heroSummaryRow}>
            <View style={[styles.heroSummaryCard, { backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.heroSummaryValue, { color: palette.gray800 }]}>{overview?.pendingApprovals ?? 0}</Text>
              <Text style={[styles.heroSummaryLabel, { color: palette.gray500 }]}>Pending approvals</Text>
            </View>
            <View style={[styles.heroSummaryCard, { backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.heroSummaryValue, { color: palette.gray800 }]}>{overview?.recentAuditLogs?.length ?? 0}</Text>
              <Text style={[styles.heroSummaryLabel, { color: palette.gray500 }]}>Recent actions</Text>
            </View>
            <View style={[styles.heroSummaryCard, { backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.heroSummaryValue, { color: palette.gray800 }]}>{overview?.overdueBorrowings ?? 0}</Text>
              <Text style={[styles.heroSummaryLabel, { color: palette.gray500 }]}>Overdue book loans</Text>
            </View>
          </View>

          <View style={styles.heroButtons}>
            <StyledButton title="Refresh data" variant="success" onPress={loadOverview} loading={loading} style={styles.heroButton} />
            <StyledButton title="Generate report" variant="outlineGreen" onPress={() => navigation.navigate('Reports')} style={styles.heroButton} />
            <StyledButton title="Open accounts" variant="outlineGreen" onPress={() => navigation.navigate('Accounts')} style={styles.heroButton} />
            <StyledButton title="Borrowing queue" variant="outlineGreen" onPress={() => navigation.navigate('Borrowings')} style={styles.heroButton} />
            <StyledButton title="Edit profile" variant="outline" onPress={() => navigation.navigate('Profile')} style={styles.heroButton} />
            <StyledButton title="Logout" variant="outline" onPress={() => dispatch(logout())} style={styles.heroButton} />
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Overview</Text>
          <Text style={[styles.sectionText, { color: palette.gray500 }]}>Quick system snapshot</Text>
        </View>

        <View style={styles.metricGrid}>
          {metricCards.map((item) => renderMetric({ item }))}
        </View>

        <MiniBarChart
          title="User distribution"
          subtitle="Breakdown of the active account base"
          items={chartItems}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>User growth</Text>
          <Text style={[styles.sectionText, { color: palette.gray500 }]}>Daily, weekly, and monthly registrations</Text>
        </View>

        <View style={styles.growthStatsRow}>
          <StatCard icon="person" iconColor={palette.green} label="Today" value={growth?.totals?.today ?? 0} />
          <StatCard icon="people" iconColor={palette.blue} label="Last 7 Days" value={growth?.totals?.last7Days ?? 0} />
          <StatCard icon="stats-chart" iconColor={palette.orange} label="Last 30 Days" value={growth?.totals?.last30Days ?? 0} />
          <StatCard icon="time" iconColor={palette.red} label="Selected Range" value={growth?.totals?.rangeTotal ?? 0} />
        </View>

        <Card style={styles.growthCard}>
          <View style={styles.growthHeaderRow}>
            <View>
              <Text style={[styles.sectionKicker, { color: palette.green }]}>Date range</Text>
              <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Filter user growth</Text>
              <Text style={[styles.sectionText, { color: palette.gray500 }]}>Pick a preset or set a custom range.</Text>
            </View>
            <Pressable
              style={[styles.pulseChip, { backgroundColor: palette.greenLight }]}
              onPress={refreshGrowth}
            >
              <Icon name="refresh" size={16} color={palette.chestnut} />
              <Text style={[styles.pulseText, { color: palette.chestnut }]}>Refresh</Text>
            </Pressable>
          </View>

          <View style={styles.growthFilterRow}>
            <RangeChip
              label="7D"
              active={rangePreset === '7d'}
              onPress={() => (rangePreset === '7d' ? refreshGrowth() : applyPresetRange('7d'))}
              palette={palette}
            />
            <RangeChip
              label="30D"
              active={rangePreset === '30d'}
              onPress={() => (rangePreset === '30d' ? refreshGrowth() : applyPresetRange('30d'))}
              palette={palette}
            />
            <RangeChip
              label="90D"
              active={rangePreset === '90d'}
              onPress={() => (rangePreset === '90d' ? refreshGrowth() : applyPresetRange('90d'))}
              palette={palette}
            />
            <RangeChip
              label="Custom"
              active={rangePreset === 'custom'}
              onPress={() => (rangePreset === 'custom' ? refreshGrowth() : applyPresetRange('custom'))}
              palette={palette}
            />
          </View>

          {rangePreset === 'custom' ? (
            <View style={styles.customRangeRow}>
              <StyledInput
                label="Start date (YYYY-MM-DD)"
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="2026-01-01"
                containerStyle={styles.customInput}
                error={rangeError}
              />
              <StyledInput
                label="End date (YYYY-MM-DD)"
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="2026-01-31"
                containerStyle={styles.customInput}
                error={rangeError}
              />
              <StyledButton title="Apply range" variant="success" onPress={applyCustomRange} style={styles.customApplyButton} />
            </View>
          ) : null}
        </Card>

        {growthLoading ? (
          <Card style={styles.growthCard}>
            <Text style={[styles.sectionText, { color: palette.gray500 }]}>Loading growth report...</Text>
          </Card>
        ) : !growth?.range ? (
          <EmptyState icon="stats-chart" message="No user growth data available for this range." />
        ) : (
          <View style={styles.growthCharts}>
            {chartVariant === 'hourly' ? (
              <LineChart
                title="Hourly registrations"
                subtitle="New users by hour"
                items={growthHourlyItems}
              />
            ) : null}
            {chartVariant === 'daily' ? (
              <MiniBarChart
                title="Daily registrations"
                subtitle="New users per day"
                items={growthDailyItems}
              />
            ) : null}
            {chartVariant === 'calendar' ? (
              <CalendarHeatmap
                title="30-day registrations"
                subtitle="Daily totals in a calendar view"
                rangeStart={growth.range.start}
                rangeEnd={growth.range.end}
                items={growthDailyItems}
              />
            ) : null}
            {chartVariant === 'weekly' ? (
              <LineChart
                title="Weekly registrations"
                subtitle="Weekly signup totals"
                items={growthWeeklyItems}
              />
            ) : null}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Quick actions</Text>
          <Text style={[styles.sectionText, { color: palette.gray500 }]}>Jump to the main supervision tools</Text>
        </View>

        <View style={styles.quickGrid}>{QUICK_ACTIONS.map(renderQuickAction)}</View>

        <Card style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <View>
              <Text style={[styles.sectionKicker, { color: palette.green }]}>Profile</Text>
              <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Personal settings</Text>
            </View>
            <Icon name="person-circle" size={24} color={palette.chestnut} />
          </View>
          <Text style={[styles.sectionText, { color: palette.gray500 }]}>Update your name, profile picture, password, and dark mode preference from the Profile tab.</Text>
          <View style={styles.profileActions}>
            <StyledButton title="Open profile" variant="success" onPress={() => navigation.navigate('Profile')} style={styles.profileAction} />
              <StyledButton title="Manage accounts" variant="outlineGreen" onPress={() => navigation.navigate('Accounts')} style={styles.profileAction} />
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Recent users</Text>
          <Text style={[styles.sectionText, { color: palette.gray500 }]}>Newest registrations and accounts</Text>
        </View>

        <View style={styles.listStack}>
          {recentUsers.length ? recentUsers.map((user) => (
            <Card key={user._id} style={styles.listCard}>
              <View style={styles.listRow}>
                <View style={[styles.listIcon, { backgroundColor: palette.greenLight }]}>
                  <Icon name="person" size={18} color={palette.chestnut} />
                </View>
                <View style={styles.listBody}>
                  <Text
                    style={[styles.listTitle, isCompact && styles.compactText, { color: palette.gray800 }]}
                    numberOfLines={isCompact ? 0 : 1}
                    ellipsizeMode="tail"
                  >
                    {user.full_name || user.name}
                  </Text>
                  <Text style={[styles.listMeta, { color: palette.gray500 }]}>
                    {user.role} • {user.verificationStatus}
                  </Text>
                </View>
              </View>
            </Card>
          )) : loading ? null : <EmptyState icon="people-outline" message="No recent users found." />}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Recent activity</Text>
          <Text style={[styles.sectionText, { color: palette.gray500 }]}>Latest admin actions across the system</Text>
        </View>

        <View style={styles.listStack}>
          {recentLogs.length ? recentLogs.map((log) => (
            <Card key={log._id} style={styles.listCard}>
              <View style={styles.listRow}>
                <View style={[styles.listIcon, { backgroundColor: palette.blueLight }]}>
                  <Icon name="document-text" size={18} color={palette.blue} />
                </View>
                <View style={styles.listBody}>
                  <Text style={[styles.listTitle, { color: palette.gray800 }]} numberOfLines={1}>{log.action}</Text>
                  <Text
                    style={[styles.listText, isCompact && styles.compactText, { color: palette.gray500 }]}
                    numberOfLines={isCompact ? 0 : 1}
                    ellipsizeMode="tail"
                  >
                    {log.actorId?.name || log.actorId?.email || log.actorRole || 'System'}
                  </Text>
                  <Text style={[styles.listMeta, { color: palette.gray500 }]}>{new Date(log.createdAt).toLocaleString()}</Text>
                </View>
              </View>
            </Card>
          )) : loading ? null : <EmptyState icon="document-text-outline" message="No recent activity found." />}
        </View>
      </View>
    </ScrollView>
  );
}

function PressableAction({ title, icon, color, onPress }) {
  return (
    <Card style={styles.quickCard}>
      <StyledButton
        title={title}
        variant="outlineGreen"
        icon={<Icon name={icon} size={18} color={color} />}
        onPress={onPress}
        style={styles.quickButton}
      />
    </Card>
  );
}

function RangeChip({ label, active, onPress, palette }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.rangeChip,
        {
          backgroundColor: active ? palette.green : palette.surface,
          borderColor: active ? palette.green : palette.gray200,
        },
      ]}
    >
      <Text style={[styles.rangeChipText, { color: active ? palette.white : palette.gray700 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingBottom: spacing.xxl,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  heroCard: {
    gap: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...shadows.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  profileSpotlight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: radii.full,
  },
  profileInitial: { ...fonts.lg, ...fonts.bold },
  profileCopy: { flex: 1, gap: 4 },
  heroKicker: { ...fonts.xs, ...fonts.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { ...fonts.lg, ...fonts.bold },
  heroText: { ...fonts.sm, lineHeight: 20 },
  compactText: { textAlign: 'left', marginTop: 2 },
  pulseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  pulseText: { ...fonts.xs, ...fonts.semibold },
  heroSummaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  heroSummaryCard: {
    flex: 1,
    minWidth: 80,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  heroSummaryValue: { ...fonts.lg, ...fonts.bold },
  heroSummaryLabel: { ...fonts.xs, ...fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroButtons: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  heroButton: { flexGrow: 1, minWidth: 145 },
  sectionHeader: { gap: 4 },
  sectionKicker: { ...fonts.xs, ...fonts.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionTitle: { ...fonts.lg, ...fonts.bold },
  sectionText: { ...fonts.sm, lineHeight: 20 },
  metricList: { gap: spacing.md, paddingBottom: spacing.sm },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
  },
  metricValue: { ...fonts.xl, ...fonts.bold },
  metricLabel: { ...fonts.xs, ...fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  quickCard: { flexGrow: 1, minWidth: 170, padding: spacing.md, borderRadius: radii.xl },
  quickButton: { width: '100%' },
  growthStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  growthCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
  },
  growthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  growthFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rangeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  rangeChipText: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  customRangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  customInput: {
    flexGrow: 1,
    minWidth: 200,
  },
  customApplyButton: {
    minWidth: 140,
  },
  growthCharts: {
    gap: spacing.lg,
  },
  profileCard: {
    gap: spacing.lg,
    borderRadius: radii.xl,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  profileActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  profileAction: {
    flexGrow: 1,
    minWidth: 150,
  },
  listStack: { gap: spacing.md },
  listCard: { padding: spacing.lg, borderRadius: radii.xl },
  listRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  listIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: { flex: 1, gap: 2 },
  listTitle: { ...fonts.base, ...fonts.bold },
  listText: { ...fonts.sm },
  listMeta: { ...fonts.xs },
});
