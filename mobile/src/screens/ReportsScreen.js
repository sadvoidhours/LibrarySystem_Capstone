import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { baseStyles, fonts, palette, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StatCard from '../components/StatCard';

export default function ReportsScreen() {
  const [borrowings, setBorrowings] = useState([]);
  const [penalties, setPenalties] = useState({ payments: [], overdueItems: [] });

  useEffect(() => {
    api.get('/reports/borrowings').then(({ data }) => setBorrowings(data)).catch(() => null);
    api.get('/reports/penalties').then(({ data }) => setPenalties(data)).catch(() => null);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Reports" subtitle="Borrowing, overdue, and payment insights" />

        <View style={styles.statsRow}>
          <StatCard icon="swap-horizontal" iconColor={palette.blue} label="Borrowing Activity" value={borrowings.length} />
          <StatCard icon="cash" iconColor={palette.green} label="Penalties Collected" value={penalties.payments.length} />
          <StatCard icon="alert-circle" iconColor={palette.red} label="Overdue Items" value={penalties.overdueItems.length} />
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {penalties.payments.length === 0 ? (
            <Text style={styles.empty}>No payments recorded yet.</Text>
          ) : (
            penalties.payments.slice(0, 10).map((item) => (
              <View key={item._id} style={styles.paymentRow}>
                <Text style={styles.paymentAmount}>₱{item.amount}</Text>
                <Text style={styles.paymentMethod}>{item.payment_method}</Text>
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: palette.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { ...fonts.base, ...fonts.bold, color: palette.gray700, marginBottom: spacing.md },
  empty: { ...fonts.sm, color: palette.gray400 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray100,
  },
  paymentAmount: { ...fonts.base, ...fonts.semibold, color: palette.gray800 },
  paymentMethod: { ...fonts.sm, color: palette.gray500 },
});
