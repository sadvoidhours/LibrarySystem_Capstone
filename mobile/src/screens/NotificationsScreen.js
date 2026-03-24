import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationRead } from '../store/slices/notificationsSlice';
import { baseStyles, fonts, getThemePalette, radii, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';

export default function NotificationsScreen() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.notifications.items);
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);
  const todayCount = useMemo(
    () =>
      items.filter((item) => {
        const created = new Date(item.createdAt);
        const now = new Date();
        return created.toDateString() === now.toDateString();
      }).length,
    [items]
  );

  const visibleItems = useMemo(() => {
    if (filter === 'unread') {
      return items.filter((item) => !item.is_read);
    }

    if (filter === 'read') {
      return items.filter((item) => item.is_read);
    }

    return items;
  }, [filter, items]);

  const markRead = (notificationId) => {
    dispatch(markNotificationRead(notificationId));
  };

  const renderItem = ({ item }) => (
    <Pressable onPress={() => !item.is_read && markRead(item._id)}>
      <Card style={[styles.card, { borderColor: palette.gray100, backgroundColor: item.is_read ? palette.surface : palette.greenLight }]}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: palette.white }]}>
            <Ionicons name={item.is_read ? 'notifications-outline' : 'notifications'} size={20} color={palette.chestnut} />
          </View>
          <View style={styles.body}>
            <View style={styles.messageRow}>
              <Text style={[styles.message, { color: palette.gray800 }]}>{item.message}</Text>
              {!item.is_read ? <View style={[styles.dot, { backgroundColor: palette.chestnut }]} /> : null}
            </View>
            <Text style={[styles.date, { color: palette.gray500 }]}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  const filterOptions = [
    { key: 'all', label: `All (${items.length})` },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'read', label: `Read (${items.length - unreadCount})` },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Notifications" subtitle="Due date reminders and overdue notices" />
        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: palette.green }]}>Inbox</Text>
            <Text style={[styles.heroTitle, { color: palette.gray800 }]}>Stay informed without digging through menus</Text>
            <Text style={[styles.heroText, { color: palette.gray500 }]}>Unread alerts stay highlighted. Tap a card to mark it as read.</Text>
          </View>
          <View style={[styles.heroStats, isWide && styles.heroStatsWide]}>
            <View style={[styles.statCard, { backgroundColor: palette.greenLight }]}>
              <Text style={[styles.statValue, { color: palette.green }]}>{items.length}</Text>
              <Text style={[styles.statLabel, { color: palette.gray600 }]}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: palette.yellowSoft }]}>
              <Text style={[styles.statValue, { color: palette.chestnut }]}>{unreadCount}</Text>
              <Text style={[styles.statLabel, { color: palette.gray600 }]}>Unread</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: palette.blueLight }]}>
              <Text style={[styles.statValue, { color: palette.blue }]}>{todayCount}</Text>
              <Text style={[styles.statLabel, { color: palette.gray600 }]}>Today</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((option) => {
            const active = filter === option.key;
            return (
              <Pressable key={option.key} onPress={() => setFilter(option.key)}>
                <View
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? palette.chestnut : palette.surface,
                      borderColor: active ? palette.chestnut : palette.gray200,
                    },
                  ]}
                >
                  <Text style={[styles.filterText, { color: active ? palette.white : palette.gray600 }]}>
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="notifications-off-outline" message="No notifications match this filter." />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => dispatch(fetchNotifications())} tintColor={palette.green} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
  heroCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.xs,
  },
  heroKicker: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...fonts.lg,
    ...fonts.bold,
    lineHeight: 30,
  },
  heroText: {
    ...fonts.sm,
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  heroStatsWide: {
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 2,
  },
  statValue: {
    ...fonts.xl,
    ...fonts.bold,
  },
  statLabel: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterText: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xs },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radii.full, marginTop: 6 },
  message: { ...fonts.base, flex: 1 },
  date: { ...fonts.xs },
});
