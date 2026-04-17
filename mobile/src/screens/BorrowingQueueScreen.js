import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api from '../api/client';
import { baseStyles, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { exportReceiptPdf } from '../utils/receipt';

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Card'];

const QUEUE_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'settled', label: 'Settled' },
];

const STATUS_CONFIG = (palette) => ({
  Pending: { bg: palette.orangeLight, color: palette.orange, icon: 'time' },
  Active: { bg: palette.greenLight, color: palette.green, icon: 'checkmark-circle' },
  Overdue: { bg: palette.redLight, color: palette.red, icon: 'alert-circle' },
  Returned: { bg: palette.blueLight, color: palette.blue, icon: 'arrow-undo-circle' },
  Rejected: { bg: palette.gray100, color: palette.gray500, icon: 'close-circle' },
});

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function BorrowingQueueScreen() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const statusConfig = useMemo(() => STATUS_CONFIG(palette), [palette]);

  const [pendingBorrowings, setPendingBorrowings] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [selectedBorrowing, setSelectedBorrowing] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [dueDays, setDueDays] = useState('7');
  const [remarks, setRemarks] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [filter, setFilter] = useState('pending');

  const settledIds = useMemo(() => {
    return new Set(
      payments
        .map((payment) => payment.borrowingId?._id || payment.borrowingId)
        .filter(Boolean)
        .map(String)
    );
  }, [payments]);

  const filterCounts = useMemo(() => {
    const normalizedBorrowings = borrowings.map((borrowing) => String(borrowing.status || '').toLowerCase());

    return {
      pending: pendingBorrowings.length,
      active: normalizedBorrowings.filter((status) => status === 'active').length,
      overdue: normalizedBorrowings.filter((status) => status === 'overdue').length,
      returned: normalizedBorrowings.filter((status) => status === 'returned').length,
      rejected: normalizedBorrowings.filter((status) => status === 'rejected').length,
      settled: settledIds.size,
    };
  }, [borrowings, pendingBorrowings.length, settledIds]);

  const visiblePendingBorrowings = useMemo(() => {
    return pendingBorrowings.filter((borrowing) => {
      if (filter === 'pending') return borrowing.status === 'Pending';
      return borrowing.status.toLowerCase() === filter;
    });
  }, [pendingBorrowings, filter]);

  const visibleBorrowings = useMemo(() => {
    if (filter === 'settled') {
      return borrowings.filter((borrowing) => settledIds.has(String(borrowing._id)));
    }

    if (filter === 'pending') {
      return borrowings.filter((borrowing) => borrowing.status === 'Pending');
    }

    return borrowings.filter((borrowing) => borrowing.status.toLowerCase() === filter);
  }, [borrowings, filter, settledIds]);

  const visiblePayments = useMemo(() => {
    if (filter === 'settled' || filter === 'pending') {
      return payments;
    }

    return payments.filter((payment) => {
      const borrowing = borrowings.find((item) => String(item._id) === String(payment.borrowingId?._id || payment.borrowingId));
      return borrowing ? borrowing.status.toLowerCase() === filter : true;
    });
  }, [borrowings, filter, payments]);

  const loadData = async () => {
    const [{ data: pendingData }, { data: borrowingsData }, { data: paymentData }] = await Promise.all([
      api.get('/borrowings/pending'),
      api.get('/reports/borrowings'),
      api.get('/payments'),
    ]);

    setPendingBorrowings(pendingData);
    setBorrowings(borrowingsData);
    setPayments(paymentData);
  };

  useEffect(() => {
    setLoading(true);
    loadData().catch((error) => {
      Alert.alert('Error', error.response?.data?.message || 'Unable to load borrowing queue');
    }).finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadData().catch((error) => {
      Alert.alert('Error', error.response?.data?.message || 'Unable to refresh borrowing queue');
    });
    setRefreshing(false);
  };

  const openApprove = (borrowing) => {
    setSelectedBorrowing(borrowing);
    setActionMode('approve');
    setDueDays('7');
    setRemarks('');
  };

  const openReject = (borrowing) => {
    setSelectedBorrowing(borrowing);
    setActionMode('reject');
    setRemarks('');
  };

  const openPayment = (borrowing) => {
    setSelectedBorrowing(borrowing);
    setActionMode('payment');
    setPaymentAmount(String(Number(borrowing.penaltyAmount || 0).toFixed(2)));
    setPaymentMethod('Cash');
  };

  const closeModal = () => {
    setSelectedBorrowing(null);
    setActionMode(null);
    setRemarks('');
    setDueDays('7');
    setPaymentAmount('');
    setPaymentMethod('Cash');
  };

  const submitAction = async () => {
    if (!selectedBorrowing || !actionMode) {
      return;
    }

    try {
      setSavingId(selectedBorrowing._id);

      if (actionMode === 'approve') {
        await api.patch(`/borrowings/${selectedBorrowing._id}/approve`, {
          dueDays: Number(dueDays) || 7,
          remarks,
        });
      } else if (actionMode === 'reject') {
        await api.patch(`/borrowings/${selectedBorrowing._id}/reject`, {
          remarks,
        });
      } else if (actionMode === 'payment') {
        await api.post('/payments', {
          borrowingId: selectedBorrowing._id,
          amount: Number(paymentAmount),
          payment_method: paymentMethod,
        });
      }

      closeModal();
      await loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to complete action');
    } finally {
      setSavingId(null);
    }
  };

  const renderPending = (borrowing) => {
    const cfg = statusConfig[borrowing.status] || statusConfig.Pending;

    return (
      <Card key={borrowing._id} style={styles.card}>
        <View style={styles.rowTop}>
          <View style={styles.bookCopy}>
            <Text style={[styles.title, { color: palette.gray800 }]} numberOfLines={2}>{borrowing.bookId?.title || 'Book'}</Text>
            <Text style={[styles.subtitle, { color: palette.gray500 }]}>{borrowing.bookId?.author || 'Unknown author'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{borrowing.status}</Text>
          </View>
        </View>

        <Text style={[styles.meta, { color: palette.gray500 }]}>Borrower: {borrowing.userId?.name || 'N/A'}</Text>
        <Text style={[styles.meta, { color: palette.gray500 }]}>Email: {borrowing.userId?.email || 'N/A'}</Text>
        <Text style={[styles.meta, { color: palette.gray500 }]}>Requested: {formatDate(borrowing.createdAt)}</Text>

        <View style={styles.actionRow}>
          <StyledButton title="Approve" variant="success" small onPress={() => openApprove(borrowing)} style={styles.actionButton} />
          <StyledButton title="Reject" variant="danger" small onPress={() => openReject(borrowing)} style={styles.actionButton} />
        </View>
      </Card>
    );
  };

  const renderBorrowing = (borrowing) => {
    const cfg = statusConfig[borrowing.status] || statusConfig.Pending;
    const isSettled = settledIds.has(String(borrowing._id));
    const canSettle = Number(borrowing.penaltyAmount || 0) > 0 && !isSettled;

    return (
      <Card key={borrowing._id} style={styles.card}>
        <View style={styles.rowTop}>
          <View style={styles.bookCopy}>
            <Text style={[styles.title, { color: palette.gray800 }]} numberOfLines={2}>{borrowing.bookId?.title || 'Book'}</Text>
            <Text style={[styles.subtitle, { color: palette.gray500 }]}>{borrowing.userId?.name || 'Borrower'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{borrowing.status}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.meta, { color: palette.gray500 }]}>Due: {formatDate(borrowing.due_date)}</Text>
          <Text style={[styles.meta, { color: palette.gray500 }]}>Penalty: ₱{Number(borrowing.penaltyAmount || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.meta, { color: palette.gray500 }]}>Borrowed: {formatDate(borrowing.borrow_date)}</Text>
          <Text style={[styles.meta, { color: palette.gray500 }]}>Status updated: {formatDate(borrowing.updatedAt)}</Text>
        </View>

        {isSettled ? (
          <View style={styles.settledBox}>
            <Ionicons name="checkmark-circle" size={16} color={palette.green} />
            <Text style={[styles.settledText, { color: palette.green }]}>Penalty settled</Text>
            {payments.find((payment) => String(payment.borrowingId?._id || payment.borrowingId) === String(borrowing._id)) ? (
              <StyledButton
                title="Receipt PDF"
                variant="outline"
                small
                onPress={() => {
                  const payment = payments.find((item) => String(item.borrowingId?._id || item.borrowingId) === String(borrowing._id));
                  exportReceiptPdf({
                    paymentId: payment?._id,
                    paymentDate: payment?.payment_date || payment?.createdAt,
                    amount: payment?.amount,
                    paymentMethod: payment?.payment_method,
                    bookTitle: borrowing.bookId?.title,
                    bookAuthor: borrowing.bookId?.author,
                    borrowerName: borrowing.userId?.name,
                    dueDate: borrowing.due_date,
                    borrowDate: borrowing.borrow_date,
                  }, { palette });
                }}
              />
            ) : null}
          </View>
        ) : canSettle ? (
          <StyledButton title="Record Payment" variant="success" small onPress={() => openPayment(borrowing)} />
        ) : null}
      </Card>
    );
  };

  const paymentRecord = selectedBorrowing
    ? payments.find((payment) => String(payment.borrowingId?._id || payment.borrowingId) === String(selectedBorrowing._id))
    : null;

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.green} />}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader title="Borrowing Queue" subtitle="Approve requests and settle penalties" />
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionKicker, { color: palette.green }]}>Pending requests</Text>
                <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Approve or reject borrowing requests</Text>
              </View>
              <Text style={[styles.sectionCount, { color: palette.gray500 }]}>{pendingBorrowings.length} requests</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {QUEUE_FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <Pressable key={item.key} onPress={() => setFilter(item.key)}>
                    <View
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active ? palette.chestnut : palette.surfaceAlt,
                          borderColor: active ? palette.chestnut : palette.gray200,
                        },
                      ]}
                    >
                      <Text style={[styles.filterText, { color: active ? palette.white : palette.gray600 }]}>{item.label}</Text>
                      <View style={[styles.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.18)' : palette.surface }]}>
                        <Text style={[styles.filterCountText, { color: active ? palette.white : palette.gray600 }]}>
                          {filterCounts[item.key] ?? 0}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loading ? null : visiblePendingBorrowings.length ? (
              <View style={styles.listStack}>{visiblePendingBorrowings.map(renderPending)}</View>
            ) : (
              <EmptyState icon="hourglass-outline" message="No borrowing requests match this filter." />
            )}
          </Card>

          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionKicker, { color: palette.green }]}>Borrowings</Text>
                <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Active, overdue, and returned items</Text>
              </View>
              <Text style={[styles.sectionCount, { color: palette.gray500 }]}>{borrowings.length} records</Text>
            </View>

            {loading ? null : visibleBorrowings.length ? (
              <View style={styles.listStack}>{visibleBorrowings.map(renderBorrowing)}</View>
            ) : (
              <EmptyState icon="library-outline" message="No borrowing records match this filter." />
            )}
          </Card>

          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionKicker, { color: palette.green }]}>Payments</Text>
                <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Recorded settlements</Text>
              </View>
              <Text style={[styles.sectionCount, { color: palette.gray500 }]}>{payments.length} payments</Text>
            </View>

            {loading ? null : visiblePayments.length ? (
              <View style={styles.listStack}>
                {visiblePayments.slice(0, 8).map((payment) => (
                  <View key={payment._id} style={[styles.paymentRow, { borderColor: palette.gray100 }]}> 
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.paymentAmount, { color: palette.gray800 }]}>₱{Number(payment.amount || 0).toFixed(2)}</Text>
                      <Text style={[styles.meta, { color: palette.gray500 }]}>
                        {payment.borrowingId?.bookId?.title || 'Borrowing'} · {payment.borrowingId?.userId?.name || 'Borrower'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[styles.paymentMethod, { color: palette.green }]}>{payment.payment_method}</Text>
                      <Text style={[styles.paymentDate, { color: palette.gray400 }]}>{formatDate(payment.payment_date || payment.createdAt)}</Text>
                      <StyledButton
                        title="Receipt"
                        variant="outline"
                        small
                        onPress={() => exportReceiptPdf({
                          paymentId: payment._id,
                          paymentDate: payment.payment_date || payment.createdAt,
                          amount: payment.amount,
                          paymentMethod: payment.payment_method,
                          bookTitle: payment.borrowingId?.bookId?.title,
                          bookAuthor: payment.borrowingId?.bookId?.author,
                          borrowerName: payment.borrowingId?.userId?.name,
                          dueDate: payment.borrowingId?.due_date,
                          borrowDate: payment.borrowingId?.borrow_date,
                        }, { palette })}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState icon="cash-outline" message="No payments match this filter." />
            )}
          </Card>
        </ScrollView>
      </View>

      <Modal visible={Boolean(selectedBorrowing)} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable onPress={() => null} style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '100%' }}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalKicker, { color: palette.green }]}>
                  {actionMode === 'approve' ? 'Approve request' : actionMode === 'reject' ? 'Reject request' : 'Record payment'}
                </Text>
                <Text style={[styles.modalTitle, { color: palette.gray800 }]} numberOfLines={2}>
                  {selectedBorrowing?.bookId?.title || 'Borrowing'}
                </Text>
              </View>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={18} color={palette.gray500} />
              </Pressable>
            </View>

            <Text style={[styles.modalText, { color: palette.gray500 }]}>Borrower: {selectedBorrowing?.userId?.name || 'N/A'}</Text>
            {actionMode === 'approve' ? (
              <>
                <StyledInput label="Due days" value={dueDays} onChangeText={setDueDays} keyboardType="numeric" placeholder="7" />
                <StyledInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Optional notes" multiline />
              </>
            ) : null}

            {actionMode === 'reject' ? (
              <StyledInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Optional rejection notes" multiline />
            ) : null}

            {actionMode === 'payment' ? (
              <>
                <StyledInput label="Amount" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" placeholder="0.00" />
                <View style={styles.methodBlock}>
                  <Text style={[styles.methodLabel, { color: palette.gray600 }]}>Payment Method</Text>
                  <View style={styles.methodRow}>
                    {PAYMENT_METHODS.map((method) => (
                      <StyledButton
                        key={method}
                        title={method}
                        small
                        variant={paymentMethod === method ? 'primary' : 'secondary'}
                        onPress={() => setPaymentMethod(method)}
                        style={styles.methodButton}
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.modalHint, { color: palette.gray500 }]}>Penalty due: ₱{Number(selectedBorrowing?.penaltyAmount || 0).toFixed(2)}</Text>
                {paymentRecord ? <Text style={[styles.modalHint, { color: palette.green }]}>Payment already exists for this borrowing.</Text> : null}
              </>
            ) : null}

            <View style={styles.modalActions}>
              <StyledButton title="Cancel" variant="outline" onPress={closeModal} style={styles.modalButton} />
              <StyledButton
                title={actionMode === 'approve' ? 'Approve' : actionMode === 'reject' ? 'Reject' : 'Save Payment'}
                variant={actionMode === 'reject' ? 'danger' : 'success'}
                onPress={submitAction}
                loading={savingId === selectedBorrowing?._id}
                style={styles.modalButton}
              />
            </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (p) => StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
  scrollContent: { gap: spacing.lg, paddingBottom: spacing.xl },
  sectionCard: { gap: spacing.md, padding: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sectionKicker: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    ...fonts.lg,
    ...fonts.bold,
  },
  sectionCount: {
    ...fonts.sm,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: spacing.sm,
  },
  filterText: {
    ...fonts.sm,
    ...fonts.semibold,
  },
  filterCount: {
    minWidth: 24,
    height: 24,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountText: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  listStack: { gap: spacing.sm },
  card: { gap: spacing.sm },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  bookCopy: { flex: 1, gap: 2 },
  title: { ...fonts.base, ...fonts.bold },
  subtitle: { ...fonts.sm },
  meta: { ...fonts.sm, lineHeight: 18 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusText: { ...fonts.xs, ...fonts.semibold },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  settledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: p.greenLight,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexWrap: 'wrap',
  },
  settledText: { ...fonts.sm, ...fonts.semibold, flex: 1 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  paymentAmount: { ...fonts.base, ...fonts.bold },
  paymentMethod: { ...fonts.xs, ...fonts.semibold },
  paymentDate: { ...fonts.xs },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  modalKicker: {
    ...fonts.xs,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalTitle: {
    ...fonts.lg,
    ...fonts.bold,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: { ...fonts.sm, lineHeight: 20 },
  modalHint: { ...fonts.sm, lineHeight: 20 },
  methodBlock: { gap: spacing.sm },
  methodLabel: { ...fonts.sm, ...fonts.semibold },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  methodButton: { flexGrow: 1, minWidth: 92 },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
