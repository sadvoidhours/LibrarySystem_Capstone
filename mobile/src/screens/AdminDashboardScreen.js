import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import api from '../api/client';
import { logout } from '../store/slices/authSlice';
import { baseStyles, fonts, palette, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import StatCard from '../components/StatCard';
import StyledButton from '../components/StyledButton';

export default function AdminDashboardScreen() {
  const dispatch = useDispatch();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/reports/overview').then(({ data }) => setStats(data)).catch(() => null);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Admin Dashboard" subtitle="Librarian operations overview" />

        <View style={styles.grid}>
          <StatCard icon="book" iconColor={palette.blue} label="Total Books" value={stats?.totalBooks || 0} />
          <StatCard icon="people" iconColor={palette.olive} label="Users" value={stats?.registeredUsers || 0} />
        </View>
        <View style={styles.grid}>
          <StatCard icon="swap-horizontal" iconColor={palette.green} label="Active Borrows" value={stats?.activeBorrowings || 0} />
          <StatCard icon="time" iconColor={palette.orange} label="Pending" value={stats?.pendingRequests || 0} />
        </View>
        <View style={styles.grid}>
          <StatCard icon="cash" iconColor={palette.red} label="Penalties" value={`₱${stats?.totalPenalties || 0}`} />
        </View>

        <StyledButton
          title="Sign Out"
          variant="outline"
          onPress={() => dispatch(logout())}
        />
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
    gap: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
