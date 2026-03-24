import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import { logout } from '../store/slices/authSlice';
import { baseStyles, fonts, getThemePalette, palette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import StyledButton from '../components/StyledButton';

const QUICK_ACTIONS = [
  { key: 'catalog', title: 'Browse Catalog', icon: 'book-outline', screen: 'Catalog' },
  { key: 'borrowings', title: 'My Borrowings', icon: 'library-outline', screen: 'Borrowings' },
  { key: 'notifications', title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
];

const STATUS_META = {
  Pending: { label: 'Pending', color: palette.orange, bg: palette.orangeLight, icon: 'time' },
  Active: { label: 'Active', color: palette.green, bg: palette.greenLight, icon: 'checkmark-circle' },
  Overdue: { label: 'Overdue', color: palette.red, bg: palette.redLight, icon: 'alert-circle' },
  Returned: { label: 'Returned', color: palette.blue, bg: palette.blueLight, icon: 'arrow-undo-circle' },
  Rejected: { label: 'Rejected', color: palette.gray600, bg: palette.gray100, icon: 'close-circle' },
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const formatLongDate = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const buildCalendarDays = (date) =>
  Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setDate(date.getDate() + index - 3);
    return day;
  });

export default function UserDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const themePalette = getThemePalette(user?.themePreference || 'light');
  const [stats, setStats] = useState({ totalBorrowed: 0, active: 0, overdue: 0 });
  const [barcode, setBarcode] = useState({ code: '', qrDataUrl: '' });
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const load = async () => {
    const [{ data: borrowingsData }, barcodeRes] = await Promise.all([
      api.get('/borrowings/my'),
      api.get('/users/me/barcode'),
    ]);

    setBorrowings(borrowingsData);
    setStats({
      totalBorrowed: borrowingsData.length,
      active: borrowingsData.filter((i) => i.status === 'Active').length,
      overdue: borrowingsData.filter((i) => i.status === 'Overdue').length,
    });
    setBarcode({ code: barcodeRes.data.barcodeString, qrDataUrl: barcodeRes.data.qrDataUrl });
  };

  useEffect(() => {
    setLoading(true);
    load().catch(() => null).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load().catch(() => null);
    setRefreshing(false);
  };

  const activeBorrowings = borrowings.filter((item) => item.status === 'Active' || item.status === 'Overdue');
  const dueSoon = activeBorrowings
    .filter((item) => item.due_date)
    .slice()
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);
  const recentBorrowings = borrowings.slice(0, 4);
  const totalDueSoon = dueSoon.length;
  const overdueCount = stats.overdue;
  const currentTime = formatTime(now);
  const currentDateLabel = formatLongDate(now);
  const calendarMonth = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const calendarDays = buildCalendarDays(now);

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { backgroundColor: themePalette.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themePalette.green} />}
    >
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="User Dashboard" subtitle="Student / Faculty Portal" />

        <View style={[styles.topGrid, isWide && styles.topGridWide]}>
          <View style={styles.leftColumn}>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroCopy}>
                  <Text style={styles.eyebrow}>Welcome back</Text>
                  <Text style={styles.welcome}>Hi, {user?.name || 'User'}</Text>
                  <Text style={styles.heroText}>
                    Your library activity, barcode ID, and due dates are all in one place.
                  </Text>
                  <Text style={styles.heroDetail}>
                    Today is {currentDateLabel} • {currentTime}
                  </Text>
                </View>
                <View style={styles.heroProfileWrap}>
                  <View style={[styles.heroAvatar, { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 }]}>
                    {user?.profileImageUrl ? (
                      <Image source={{ uri: user.profileImageUrl }} style={styles.heroAvatarImage} />
                    ) : (
                      <Ionicons name="person" size={28} color={themePalette.green} />
                    )}
                  </View>
                  <View style={styles.roleChip}>
                    <Ionicons name="person-circle-outline" size={16} color={palette.green} />
                    <Text style={styles.roleChipText}>Library Member</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroMiniRow}>
                <View style={[styles.heroMiniCard, { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 }]}>
                  <Text style={[styles.heroMiniValue, { color: themePalette.gray800 }]}>{stats.totalBorrowed}</Text>
                  <Text style={[styles.heroMiniLabel, { color: themePalette.gray500 }]}>Borrowed</Text>
                </View>
                <View style={[styles.heroMiniCard, { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 }]}>
                  <Text style={[styles.heroMiniValue, { color: themePalette.gray800 }]}>{totalDueSoon}</Text>
                  <Text style={[styles.heroMiniLabel, { color: themePalette.gray500 }]}>Due soon</Text>
                </View>
                <View style={[styles.heroMiniCard, { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 }]}>
                  <Text style={[styles.heroMiniValue, { color: themePalette.gray800 }]}>{overdueCount}</Text>
                  <Text style={[styles.heroMiniLabel, { color: themePalette.gray500 }]}>Overdue</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard icon="book" iconColor={palette.blue} label="Total Borrowed" value={stats.totalBorrowed} />
              <StatCard icon="checkmark-circle" iconColor={palette.green} label="Active" value={stats.active} />
              <StatCard icon="alert-circle" iconColor={palette.red} label="Overdue" value={stats.overdue} />
            </View>

            <Card style={styles.quickActionsCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionKicker}>Quick Access</Text>
                  <Text style={styles.sectionTitle}>Go where you need fast</Text>
                </View>
              </View>
              <View style={styles.quickActionsGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <StyledButton
                    key={action.key}
                    title={action.title}
                    variant="outline"
                    onPress={() => navigation.navigate(action.screen)}
                    style={styles.quickActionButton}
                    icon={<Ionicons name={action.icon} size={16} color={palette.green} />}
                  />
                ))}
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionKicker}>Due Soon</Text>
                  <Text style={styles.sectionTitle}>Items you should return next</Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {dueSoon.length ? `${dueSoon.length} reminders · ${formatDate(dueSoon[0]?.due_date)}` : 'All clear'}
                  </Text>
                </View>
              </View>
              {dueSoon.length ? (
                <View style={styles.itemList}>
                  {dueSoon.map((item) => {
                    const meta = STATUS_META[item.status] || STATUS_META.Active;
                    return (
                      <View key={item._id} style={styles.listItem}>
                        <View style={[styles.listIcon, { backgroundColor: meta.bg }]}>
                          <Ionicons name={meta.icon} size={16} color={meta.color} />
                        </View>
                        <View style={styles.listBody}>
                          <Text style={styles.listTitle} numberOfLines={2}>{item.bookId?.title || 'Book'}</Text>
                          <Text style={styles.listMeta}>Due {formatDate(item.due_date)}</Text>
                        </View>
                        <Text style={[styles.listStatus, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyNote}>Nothing due soon. Keep up the good work.</Text>
              )}
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionKicker}>Recent Activity</Text>
                  <Text style={styles.sectionTitle}>Latest borrowing records</Text>
                </View>
              </View>
              {recentBorrowings.length ? (
                <View style={styles.itemList}>
                  {recentBorrowings.map((item) => {
                    const meta = STATUS_META[item.status] || STATUS_META.Pending;
                    return (
                      <View key={item._id} style={styles.listItem}>
                        <View style={[styles.listIcon, { backgroundColor: meta.bg }]}>
                          <Ionicons name={meta.icon} size={16} color={meta.color} />
                        </View>
                        <View style={styles.listBody}>
                          <Text style={styles.listTitle} numberOfLines={2}>{item.bookId?.title || 'Book'}</Text>
                          <Text style={styles.listMeta}>
                            {formatDate(item.createdAt)} · {item.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyNote}>Your recent activity will appear here.</Text>
              )}
            </Card>
          </View>

          <View style={styles.rightColumn}>
            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionKicker}>Access ID</Text>
                  <Text style={styles.sectionTitle}>Digital Barcode ID</Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>Ready</Text>
                </View>
              </View>
              <View style={styles.barcodeInner}>
                {loading ? (
                  <ActivityIndicator color={palette.chestnut} size="large" style={{ marginVertical: spacing.xl }} />
                ) : barcode.qrDataUrl ? (
                  <View style={[styles.qrFrame, { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 }]}>
                    <Image source={{ uri: barcode.qrDataUrl }} style={styles.qr} />
                  </View>
                ) : null}
                <Text style={styles.code}>{barcode.code}</Text>
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionKicker}>Calendar</Text>
                  <Text style={styles.sectionTitle}>Today at a glance</Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{currentTime}</Text>
                </View>
              </View>
              <View style={[styles.calendarCard, { backgroundColor: themePalette.surfaceAlt, borderColor: themePalette.gray100 }]}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarMonth}>{calendarMonth}</Text>
                  <Text style={styles.calendarHint}>{currentDateLabel}</Text>
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, index) => {
                    const isToday = index === 3;
                    return (
                      <View
                        key={day.toISOString()}
                        style={[
                          styles.calendarDay,
                          { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 },
                          isToday && { backgroundColor: themePalette.green, borderColor: themePalette.green },
                        ]}
                      >
                        <Text style={[styles.calendarDayLabel, isToday && styles.calendarDayLabelActive]}>
                          {day.toLocaleDateString(undefined, { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.calendarDayNumber, isToday && styles.calendarDayNumberActive]}>
                          {day.getDate()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionKicker}>Account</Text>
                  <Text style={styles.sectionTitle}>Your profile details</Text>
                </View>
              </View>
              <View style={styles.profileList}>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Name</Text>
                  <Text style={styles.profileValue} numberOfLines={1}>{user?.name || '-'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileValue} numberOfLines={1}>{user?.email || '-'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Role</Text>
                  <Text style={styles.profileValue}>{user?.role || 'student'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Barcode</Text>
                  <Text style={styles.profileValue} numberOfLines={1}>{barcode.code || '-'}</Text>
                </View>
              </View>
            </Card>

            <StyledButton
              title="Sign Out"
              variant="outline"
              onPress={() => dispatch(logout())}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  topGrid: {
    gap: spacing.lg,
  },
  topGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1.35,
    gap: spacing.lg,
  },
  rightColumn: {
    flex: 0.85,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: palette.greenDark,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  heroProfileWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  eyebrow: {
    ...fonts.xs,
    ...fonts.semibold,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  welcome: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.white,
  },
  heroText: {
    ...fonts.sm,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 20,
  },
  heroDetail: {
    ...fonts.xs,
    ...fonts.semibold,
    color: 'rgba(255,255,255,0.88)',
    marginTop: spacing.xs,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  roleChipText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.gray700,
  },
  heroMiniRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  heroMiniCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  heroMiniValue: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.white,
  },
  heroMiniLabel: {
    ...fonts.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionsCard: {
    gap: spacing.md,
  },
  quickActionsGrid: {
    gap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flex: 1,
    minWidth: 160,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  sectionKicker: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
  },
  sectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    backgroundColor: palette.greenLight,
    borderRadius: radii.full,
  },
  sectionBadgeText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
  },
  itemList: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray100,
  },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    ...fonts.sm,
    ...fonts.semibold,
    color: palette.gray800,
  },
  listMeta: {
    ...fonts.xs,
    color: palette.gray500,
  },
  listStatus: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  emptyNote: {
    ...fonts.sm,
    color: palette.gray500,
  },
  barcodeInner: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrFrame: {
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray100,
  },
  qr: {
    width: 160,
    height: 160,
    borderRadius: radii.md,
  },
  code: {
    ...fonts.sm,
    ...fonts.semibold,
    color: palette.gray500,
    letterSpacing: 1,
  },
  calendarCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  calendarHeader: {
    gap: 2,
  },
  calendarMonth: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
  },
  calendarHint: {
    ...fonts.xs,
    color: palette.gray500,
  },
  calendarGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  calendarDay: {
    flex: 1,
    minWidth: 38,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray100,
  },
  calendarDayActive: {
    backgroundColor: palette.green,
    borderColor: palette.green,
  },
  calendarDayLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.gray500,
    textTransform: 'uppercase',
  },
  calendarDayLabelActive: {
    color: palette.white,
  },
  calendarDayNumber: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
    marginTop: 2,
  },
  calendarDayNumberActive: {
    color: palette.white,
  },
  profileList: {
    gap: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray100,
  },
  profileLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  profileValue: {
    ...fonts.xs,
    color: palette.gray700,
    flex: 1,
    textAlign: 'right',
  },
});