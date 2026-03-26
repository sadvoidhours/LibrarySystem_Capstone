import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import { logout } from '../store/slices/authSlice';
import { baseStyles, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import MiniBarChart from '../components/MiniBarChart';
import StatCard from '../components/StatCard';
import StyledButton from '../components/StyledButton';

export default function AdminDashboardScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const [stats, setStats] = useState(null);
  const chartItems = useMemo(() => ([
    { label: 'Books', value: stats?.totalBooks || 0, color: palette.blue },
    { label: 'Users', value: stats?.registeredUsers || 0, color: palette.green },
    { label: 'Active', value: stats?.activeBorrowings || 0, color: palette.orange },
    { label: 'Pending', value: stats?.pendingRequests || 0, color: palette.red },
  ]), [stats, palette]);

  useEffect(() => {
    api.get('/reports/overview').then(({ data }) => setStats(data)).catch(() => null);
  }, []);

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Admin Dashboard" subtitle="Librarian operations overview" />

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroKicker, { color: palette.green }]}>Operations</Text>
              <Text style={[styles.heroTitle, { color: palette.gray800 }]}>Manage books, borrowings, and penalties from one place</Text>
              <Text style={[styles.heroText, { color: palette.gray500 }]}>
                Review daily library activity, monitor requests, and keep the collection moving.
              </Text>
            </View>
            <View style={[styles.heroPulse, { backgroundColor: palette.greenLight }]}>
              <Text style={[styles.heroPulseValue, { color: palette.green }]}>{stats?.pendingRequests || 0}</Text>
              <Text style={[styles.heroPulseLabel, { color: palette.gray500 }]}>Pending</Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <StyledButton title="Borrowing queue" variant="success" onPress={() => navigation.navigate('Borrowings')} style={styles.heroAction} />
            <StyledButton title="Sign Out" variant="outline" onPress={() => dispatch(logout())} style={styles.heroAction} />
          </View>
        </View>

        <View style={styles.metricGrid}>
          <StatCard icon="book" iconColor={palette.blue} label="Total Books" value={stats?.totalBooks || 0} />
          <StatCard icon="people" iconColor={palette.olive} label="Users" value={stats?.registeredUsers || 0} />
          <StatCard icon="swap-horizontal" iconColor={palette.green} label="Active Borrows" value={stats?.activeBorrowings || 0} />
          <StatCard icon="time" iconColor={palette.orange} label="Pending" value={stats?.pendingRequests || 0} />
          <StatCard icon="cash" iconColor={palette.red} label="Penalties" value={`₱${stats?.totalPenalties || 0}`} />
        </View>

        <MiniBarChart
          title="Operational snapshot"
          subtitle="Volume across the main librarian workload"
          items={chartItems}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
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
    lineHeight: 30,
  },
  heroText: {
    ...fonts.sm,
    lineHeight: 20,
  },
  heroPulse: {
    minWidth: 100,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  heroPulseValue: {
    ...fonts.xl,
    ...fonts.bold,
  },
  heroPulseLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroAction: {
    flexGrow: 1,
    minWidth: 160,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
