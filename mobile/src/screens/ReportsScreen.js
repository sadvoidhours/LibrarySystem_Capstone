import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import api from '../api/client';
import { baseStyles, fonts, getThemePalette, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import MiniBarChart from '../components/MiniBarChart';
import StatCard from '../components/StatCard';
import StyledButton from '../components/StyledButton';
import { exportReceiptPdf } from '../utils/receipt';
import { exportReportPdf } from '../utils/reportPdf';

export default function ReportsScreen() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [borrowings, setBorrowings] = useState([]);
  const [penalties, setPenalties] = useState({ payments: [], overdueItems: [] });
  const reportItems = useMemo(() => ([
    { label: 'Borrowings', value: borrowings.length, color: palette.blue },
    { label: 'Payments', value: penalties.payments.length, color: palette.green },
    { label: 'Overdue', value: penalties.overdueItems.length, color: palette.red },
  ]), [borrowings.length, penalties.payments.length, penalties.overdueItems.length, palette]);

  const generatePdfReport = async () => {
    try {
      await exportReportPdf({
        title: 'Library Report',
        subtitle: 'Borrowing, overdue, and payment insights',
        metrics: [
          { label: 'Borrowings', value: borrowings.length },
          { label: 'Payments', value: penalties.payments.length },
          { label: 'Overdue', value: penalties.overdueItems.length },
        ],
        payments: penalties.payments,
        borrowings,
        overdueItems: penalties.overdueItems,
      }, { palette });
    } catch (error) {
      Alert.alert('Error', 'Unable to generate PDF report');
    }
  };

  useEffect(() => {
    api.get('/reports/borrowings').then(({ data }) => setBorrowings(data)).catch(() => null);
    api.get('/reports/penalties').then(({ data }) => setPenalties(data)).catch(() => null);
  }, []);

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader title="Reports" subtitle="Borrowing, overdue, and payment insights" />

        <View style={styles.statsRow}>
          <StatCard icon="swap-horizontal" iconColor={palette.blue} label="Borrowing Activity" value={borrowings.length} />
          <StatCard icon="cash" iconColor={palette.green} label="Penalties Collected" value={penalties.payments.length} />
          <StatCard icon="alert-circle" iconColor={palette.red} label="Overdue Items" value={penalties.overdueItems.length} />
        </View>

        <MiniBarChart
          title="Report snapshot"
          subtitle="A quick visual read on current reporting totals"
          items={reportItems}
        />

        <StyledButton title="Export PDF Report" variant="success" onPress={generatePdfReport} />

        <Card>
          <Text style={[styles.sectionTitle, { color: palette.gray700 }]}>Recent Payments</Text>
          {penalties.payments.length === 0 ? (
            <Text style={[styles.empty, { color: palette.gray400 }]}>No payments recorded yet.</Text>
          ) : (
            penalties.payments.slice(0, 10).map((item) => (
              <View key={item._id} style={[styles.paymentRow, { borderBottomColor: palette.gray100 }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.paymentAmount, { color: palette.gray800 }]}>₱{item.amount}</Text>
                  <Text style={[styles.paymentMethod, { color: palette.gray500 }]}>{item.payment_method}</Text>
                </View>
                <StyledButton
                  title="PDF"
                  small
                  variant="outline"
                  onPress={async () => {
                    try {
                      await exportReceiptPdf({
                        paymentId: item._id,
                        paymentDate: item.payment_date || item.createdAt,
                        amount: item.amount,
                        paymentMethod: item.payment_method,
                        bookTitle: item.borrowingId?.bookId?.title,
                        bookAuthor: item.borrowingId?.bookId?.author,
                        borrowerName: item.borrowingId?.userId?.name,
                        dueDate: item.borrowingId?.due_date,
                        borrowDate: item.borrowingId?.borrow_date,
                      }, { palette });
                    } catch (error) {
                      Alert.alert('Error', 'Unable to export receipt PDF');
                    }
                  }}
                />
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const createStyles = (p) => StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  sectionTitle: { ...fonts.base, ...fonts.bold, marginBottom: spacing.md },
  empty: { ...fonts.sm },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  paymentAmount: { ...fonts.base, ...fonts.semibold },
  paymentMethod: { ...fonts.sm },
});
