import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from '../components/Icon';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import { logout } from '../store/slices/authSlice';
import { baseStyles, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import StyledButton from '../components/StyledButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QUICK_ACTIONS = [
  { key: 'catalog', title: 'Browse Catalog', icon: 'book', screen: 'Catalog' },
  { key: 'borrowings', title: 'My Borrowings', icon: 'library', screen: 'Borrowings' },
  { key: 'notifications', title: 'Notifications', icon: 'notifications', screen: 'Notifications' },
];

const getStatusMeta = (p) => ({
  Pending: { label: 'Pending', color: p.orange, bg: p.orangeLight, icon: 'time' },
  Active: { label: 'Active', color: p.green, bg: p.greenLight, icon: 'checkmark-circle' },
  Overdue: { label: 'Overdue', color: p.red, bg: p.redLight, icon: 'alert-circle' },
  Returned: { label: 'Returned', color: p.blue, bg: p.blueLight, icon: 'arrow-undo-circle' },
  Rejected: { label: 'Rejected', color: p.gray600, bg: p.gray100, icon: 'close-circle' },
});

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const formatLongDate = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const getFirstName = (user) => {
  const rawName = String(user?.full_name || user?.name || '').trim();
  if (rawName) {
    return rawName.split(/\s+/)[0];
  }

  const emailLocalPart = String(user?.email || '').split('@')[0]?.trim();
  return emailLocalPart || 'Member';
};

const buildCalendarDays = (date) =>
  Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    const mondayOffset = (date.getDay() + 6) % 7;
    day.setDate(date.getDate() - mondayOffset + index);
    return day;
  });

const CALENDAR_WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function UserDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const themeMode = user?.themePreference || 'light';
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const STATUS_META = useMemo(() => getStatusMeta(palette), [palette]);
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState({ totalBorrowed: 0, active: 0, overdue: 0 });
  const [barcode, setBarcode] = useState({ code: '', qrDataUrl: '' });
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isCompact = width < 460;
  const stackHeroHeader = width < 760;
  const welcomeLineClamp = width < 760 ? 2 : 1;
  const firstName = getFirstName(user);

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
      contentContainerStyle={[
        styles.scroll,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.green} />}
    >
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="User Dashboard" subtitle="Student / Faculty Portal" />

        <View style={[styles.topGrid, isWide && styles.topGridWide]}>
          <View style={styles.leftColumn}>
            <View style={[styles.heroCard, { backgroundColor: palette.greenDark }]}>
              <View style={[styles.heroTopRow, stackHeroHeader && styles.heroTopRowStack, isCompact && styles.heroTopRowCompact]}>
                <View style={[styles.heroCopy, stackHeroHeader && styles.heroCopyStack]}>
                  <Text style={[styles.eyebrow, { color: 'rgba(255,255,255,0.72)' }]}>Welcome back</Text>
                  <Text style={[styles.welcome, { color: '#FFFFFF' }]} numberOfLines={welcomeLineClamp} ellipsizeMode="tail">
                    Hi, {firstName}
                  </Text>
                  <Text style={styles.heroText}>
                    Your library activity, barcode ID, and due dates are all in one place.
                  </Text>
                  <Text style={styles.heroDetail}>
                    Today is {currentDateLabel} • {currentTime}
                  </Text>
                </View>
                <View
                  style={[
                    styles.heroProfileWrap,
                    stackHeroHeader && styles.heroProfileWrapStack,
                    isCompact && styles.heroProfileWrapCompact,
                  ]}
                >
                  <View style={[styles.heroAvatar, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                    {user?.profileImageUrl ? (
                      <Image source={{ uri: user.profileImageUrl }} style={styles.heroAvatarImage} />
                    ) : (
                      <Icon name="person" size={28} color={palette.green} />
                    )}
                  </View>
                  <View style={styles.roleChip}>
                    <Icon name="person-circle" size={16} color={palette.green} />
                    <Text style={[styles.roleChipText, { color: palette.gray700 }]}>{user?.role || 'Member'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroMiniRow}>
                <View style={[styles.heroMiniCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                  <Text style={[styles.heroMiniValue, { color: palette.gray800 }]}>{stats.totalBorrowed}</Text>
                  <Text style={[styles.heroMiniLabel, { color: palette.gray500 }]}>Borrowed</Text>
                </View>
                <View style={[styles.heroMiniCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                  <Text style={[styles.heroMiniValue, { color: palette.gray800 }]}>{totalDueSoon}</Text>
                  <Text style={[styles.heroMiniLabel, { color: palette.gray500 }]}>Due soon</Text>
                </View>
                <View style={[styles.heroMiniCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                  <Text style={[styles.heroMiniValue, { color: palette.gray800 }]}>{overdueCount}</Text>
                  <Text style={[styles.heroMiniLabel, { color: palette.gray500 }]}>Overdue</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard icon="book-outline" iconColor={palette.blue} label="Total Borrowed" value={stats.totalBorrowed} />
              <StatCard icon="checkmark-circle-outline" iconColor={palette.green} label="Active" value={stats.active} />
              <StatCard icon="alert-circle-outline" iconColor={palette.red} label="Overdue" value={stats.overdue} />
            </View>

            <Card style={styles.quickActionsCard}>
              <View style={[styles.sectionHeader, styles.sectionHeaderCompact]}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Quick Access</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Go where you need fast</Text>
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
                    icon={<Icon name={action.icon} size={16} color={palette.green} />}
                  />
                ))}
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Due Soon</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Items you should return next</Text>
                </View>
                <View style={[styles.sectionBadge, { backgroundColor: palette.greenLight }]}>
                  <Text style={[styles.sectionBadgeText, { color: palette.green }] }>
                    {dueSoon.length ? `${dueSoon.length} reminders · ${formatDate(dueSoon[0]?.due_date)}` : 'All clear'}
                  </Text>
                </View>
              </View>
              {dueSoon.length ? (
                <View style={styles.itemList}>
                  {dueSoon.map((item) => {
                    const meta = STATUS_META[item.status] || STATUS_META.Active;
                    return (
                      <View key={item._id} style={[styles.listItem, { borderBottomColor: palette.gray100 }]}>
                        <View style={[styles.listIcon, { backgroundColor: meta.bg }]}>
                          <Icon name={meta.icon} size={16} color={meta.color} />
                        </View>
                        <View style={styles.listBody}>
                          <Text style={[styles.listTitle, { color: palette.gray800 }]} numberOfLines={2}>{item.bookId?.title || 'Book'}</Text>
                          <Text style={[styles.listMeta, { color: palette.gray500 }]}>Due {formatDate(item.due_date)}</Text>
                        </View>
                        <Text style={[styles.listStatus, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.emptyNote, { color: palette.gray500 }]}>Nothing due soon. Keep up the good work.</Text>
              )}
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Recent Activity</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Latest borrowing records</Text>
                </View>
              </View>
              {recentBorrowings.length ? (
                <View style={styles.itemList}>
                  {recentBorrowings.map((item) => {
                    const meta = STATUS_META[item.status] || STATUS_META.Pending;
                    return (
                      <View key={item._id} style={[styles.listItem, { borderBottomColor: palette.gray100 }]}>
                        <View style={[styles.listIcon, { backgroundColor: meta.bg }]}>
                          <Icon name={meta.icon} size={16} color={meta.color} />
                        </View>
                        <View style={styles.listBody}>
                          <Text style={[styles.listTitle, { color: palette.gray800 }]} numberOfLines={2}>{item.bookId?.title || 'Book'}</Text>
                          <Text style={[styles.listMeta, { color: palette.gray500 }]}>
                            {formatDate(item.createdAt)} · {item.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.emptyNote, { color: palette.gray500 }]}>Your recent activity will appear here.</Text>
              )}
            </Card>
          </View>

          <View style={styles.rightColumn}>
            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Access ID</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Digital Barcode ID</Text>
                </View>
                <View style={[styles.sectionBadge, { backgroundColor: palette.greenLight }]}>
                  <Text style={[styles.sectionBadgeText, { color: palette.green }]}>Ready</Text>
                </View>
              </View>
              <View style={styles.barcodeInner}>
                {loading ? (
                  <ActivityIndicator color={palette.chestnut} size="large" style={{ marginVertical: spacing.xl }} />
                ) : barcode.qrDataUrl ? (
                  <View style={[styles.qrFrame, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                    <Image source={{ uri: barcode.qrDataUrl }} style={styles.qr} />
                  </View>
                ) : null}
                <Text style={[styles.code, { color: palette.gray800 }]}>{barcode.code}</Text>
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Calendar</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Today at a glance</Text>
                </View>
                <View style={[styles.sectionBadge, { backgroundColor: palette.greenLight }]}>
                  <Text style={[styles.sectionBadgeText, { color: palette.green }]}>{currentTime}</Text>
                </View>
              </View>
              <View style={[styles.calendarCard, { backgroundColor: palette.surfaceAlt, borderColor: palette.gray100 }]}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarMonth, { color: palette.gray800 }]}>{calendarMonth}</Text>
                  <Text style={[styles.calendarHint, { color: palette.gray500 }]}>{currentDateLabel}</Text>
                </View>
                <View style={styles.calendarWeekRow}>
                  {CALENDAR_WEEKDAYS.map((label) => (
                    <Text key={label} style={[styles.calendarWeekLabel, { color: palette.gray500 }]}>
                      {label}
                    </Text>
                  ))}
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, index) => {
                    const isToday = day.toDateString() === now.toDateString();
                    return (
                      <View
                        key={day.toISOString()}
                        style={[
                          styles.calendarDay,
                          { backgroundColor: palette.surface, borderColor: palette.gray100 },
                          isToday && { backgroundColor: palette.green, borderColor: palette.green },
                        ]}
                      >
                        <Text style={[styles.calendarDayLabel, { color: isToday ? '#FFFFFF' : palette.gray500 }]}>
                          {CALENDAR_WEEKDAYS[index]}
                        </Text>
                        <Text style={[styles.calendarDayNumber, { color: isToday ? '#FFFFFF' : palette.gray800 }]}>
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
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Account</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Your profile details</Text>
                </View>
              </View>
              <View style={styles.profileList}>
                <View style={[styles.profileRow, { borderBottomColor: palette.gray100 }]}>
                  <Text style={[styles.profileLabel, { color: palette.gray500 }]}>Name</Text>
                  <Text
                    style={[
                      styles.profileValue,
                      styles.profileValueName,
                      isCompact && styles.profileValueStack,
                      { color: palette.gray800 },
                    ]}
                    numberOfLines={isCompact ? 0 : 1}
                    ellipsizeMode="tail"
                  >
                    {user?.full_name || user?.name || '-'}
                  </Text>
                </View>
                <View style={[styles.profileRow, { borderBottomColor: palette.gray100 }]}>
                  <Text style={[styles.profileLabel, { color: palette.gray500 }]}>Role</Text>
                  <Text style={[styles.profileValue, { color: palette.gray800 }]}>{user?.role || 'student'}</Text>
                </View>
                <View style={[styles.profileRow, { borderBottomColor: palette.gray100 }]}>
                  <Text style={[styles.profileLabel, { color: palette.gray500 }]}>Barcode</Text>
                  <Text style={[styles.profileValue, { color: palette.gray800 }]} numberOfLines={1}>{barcode.code || '-'}</Text>
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

const createStyles = (p) => StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  topGrid: {
    gap: spacing.xl,
  },
  topGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1.35,
    gap: spacing.xl,
  },
  rightColumn: {
    flex: 0.85,
    gap: spacing.xl,
  },
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  heroTopRowStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroTopRowCompact: {
    gap: spacing.sm,
  },
  heroProfileWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  heroProfileWrapStack: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.xs,
  },
  heroProfileWrapCompact: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.xs,
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
    minWidth: 0,
    flexShrink: 1,
    paddingRight: spacing.sm,
  },
  heroCopyStack: {
    width: '100%',
    paddingRight: 0,
  },
  eyebrow: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  welcome: {
    ...fonts.lg,
    ...fonts.bold,
    lineHeight: 32,
    letterSpacing: 0.2,
    marginBottom: spacing.xs,
    maxWidth: '100%',
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
    marginTop: spacing.sm,
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
  },
  heroMiniRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  heroMiniCard: {
    flex: 1,
    minWidth: 80,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  heroMiniValue: {
    ...fonts.lg,
    ...fonts.bold,
  },
  heroMiniLabel: {
    ...fonts.xs,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionsCard: {
    gap: spacing.lg,
  },
  quickActionsGrid: {
    gap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flex: 1,
    minWidth: 140,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  sectionHeaderCompact: {
    marginBottom: spacing.sm,
  },
  sectionKicker: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    ...fonts.base,
    ...fonts.bold,
    letterSpacing: 0.2,
  },
  sectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  sectionBadgeText: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  itemList: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
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
    gap: 3,
  },
  listTitle: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  listMeta: {
    ...fonts.xs,
  },
  listStatus: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  emptyNote: {
    ...fonts.sm,
    lineHeight: 20,
  },
  barcodeInner: {
    alignItems: 'center',
    gap: spacing.md,
  },
  qrFrame: {
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  qr: {
    width: 120,
    height: 120,
    borderRadius: radii.md,
  },
  code: {
    ...fonts.sm,
    ...fonts.semibold,
    letterSpacing: 1,
  },
  calendarCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  calendarHeader: {
    gap: 2,
  },
  calendarMonth: {
    ...fonts.base,
    ...fonts.bold,
  },
  calendarHint: {
    ...fonts.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    gap: 2,
    flexWrap: 'nowrap',
  },
  calendarDay: {
    flex: 1,
    minWidth: 0,
    borderRadius: radii.md,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    gap: 2,
  },
  calendarWeekLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 14,
    ...fonts.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  calendarDayLabel: {
    fontSize: 10,
    lineHeight: 14,
    ...fonts.semibold,
    textTransform: 'uppercase',
  },
  calendarDayNumber: {
    fontSize: 13,
    lineHeight: 18,
    ...fonts.bold,
    marginTop: 2,
  },
  profileList: {
    gap: spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  profileLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  profileValue: {
    ...fonts.xs,
    flex: 1,
    textAlign: 'right',
  },
  profileValueName: {
    flexShrink: 1,
  },
  profileValueStack: {
    textAlign: 'left',
    marginTop: 2,
  },
});