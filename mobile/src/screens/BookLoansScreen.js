import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from '../components/Icon';
import { useSelector } from 'react-redux';
import api from '../api/client';
import { baseStyles, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { exportReceiptPdf } from '../utils/receipt';

const getStatusConfig = (p) => ({
  Active: { bg: p.greenLight, color: p.green, icon: 'checkmark-circle' },
  Overdue: { bg: p.redLight, color: p.red, icon: 'alert-circle' },
  Returned: { bg: p.blueLight, color: p.blue, icon: 'arrow-undo-circle' },
  Pending: { bg: p.orangeLight, color: p.orange, icon: 'time' },
});

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Card'];

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const buildCalendar = (date) => {
  const monthStart = startOfMonth(date);
  const start = new Date(monthStart);
  start.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const formatShortDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatMonthLabel = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export default function BookLoansScreen() {
  const user = useSelector((state) => state.auth.user);
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const STATUS_CONFIG = useMemo(() => getStatusConfig(palette), [palette]);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const load = async () => {
    const [{ data: borrowingsData }, { data: paymentData }] = await Promise.all([
      api.get('/borrowings/my'),
      api.get('/payments/my'),
    ]);

    setItems(borrowingsData);
    setPayments(paymentData);
  };

  useEffect(() => {
    setLoading(true);
    load().catch(() => null).finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load().catch(() => null);
    setRefreshing(false);
  };

  const settledBorrowingIds = useMemo(() => {
    return new Set(
      payments
        .map((payment) => payment.borrowingId?._id || payment.borrowingId?.toString())
        .filter(Boolean)
        .map(String),
    );
  }, [payments]);

  const overdueItems = items.filter((item) => item.status === 'Overdue' || (item.status === 'Returned' && item.penaltyAmount > 0));
  const unpaidItems = overdueItems.filter((item) => !settledBorrowingIds.has(String(item._id)) && Number(item.penaltyAmount) > 0);
  const totalPenaltyDue = unpaidItems.reduce((sum, item) => sum + Number(item.penaltyAmount || 0), 0);
  const activeCount = items.filter((item) => item.status === 'Active').length;
  const overdueCount = items.filter((item) => item.status === 'Overdue').length;

  const calendarDays = buildCalendar(currentMonth);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDayBorrowings = items.filter((item) => item.due_date && sameDay(new Date(item.due_date), selectedDate));
  const monthTitle = formatMonthLabel(currentMonth);
  const selectedDayLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const selectedDayDueCount = selectedDayBorrowings.length;

  const openPaymentModal = (item) => {
    setPaymentTarget(item);
    setPaymentAmount(String(Number(item.penaltyAmount || 0).toFixed(2)));
    setPaymentMethod('Cash');
    setPaymentModalVisible(true);
  };

  const submitPayment = async () => {
    if (!paymentTarget) return;

    const amount = Number(paymentAmount);
    if (!amount || Number.isNaN(amount) || amount < 0) {
      return;
    }

    try {
      setPaymentLoading(true);
      await api.post('/payments', {
        borrowingId: paymentTarget._id,
        amount,
        payment_method: paymentMethod,
      });
      setPaymentModalVisible(false);
      setPaymentTarget(null);
      await load();
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to settle payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const renderBorrowingCard = (item) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
    const isSettled = settledBorrowingIds.has(String(item._id));
    const canSettle = Number(item.penaltyAmount || 0) > 0 && !isSettled;
    const paymentRecord = payments.find((payment) => String(payment.borrowingId?._id || payment.borrowingId) === String(item._id));

    return (
      <Card style={styles.card} key={item._id}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.title} numberOfLines={2}>{item.bookId?.title || 'Book'}</Text>
            <Text style={styles.subtitle}>{item.bookId?.author || 'Unknown author'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>{formatShortDate(item.due_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Borrowed</Text>
            <Text style={styles.detailValue}>{formatShortDate(item.borrow_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Penalty</Text>
            <Text style={[styles.detailValue, Number(item.penaltyAmount) > 0 ? styles.penaltyValue : null]}>
              ₱{Number(item.penaltyAmount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {isSettled ? (
          <View style={styles.settledBox}>
            <Icon name="checkmark-circle-outline" size={16} color={palette.green} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.settledText}>
                Settled via {paymentRecord?.payment_method || 'payment'} on {formatShortDate(paymentRecord?.payment_date || paymentRecord?.createdAt)}
              </Text>
              <StyledButton
                title="Export Receipt PDF"
                variant="outline"
                small
                onPress={async () => {
                  try {
                    await exportReceiptPdf({
                      paymentId: paymentRecord?._id,
                      paymentDate: paymentRecord?.payment_date || paymentRecord?.createdAt,
                      amount: paymentRecord?.amount,
                      paymentMethod: paymentRecord?.payment_method,
                      bookTitle: item.bookId?.title,
                      bookAuthor: item.bookId?.author,
                      borrowerName: user?.name,
                      dueDate: item.due_date,
                      borrowDate: item.borrow_date,
                    }, { palette });
                  } catch (error) {
                    Alert.alert('Error', 'Unable to export receipt PDF');
                  }
                }}
              />
            </View>
          </View>
        ) : canSettle ? (
          <View style={styles.actionRow}>
            <StyledButton title="Settle Payment" variant="success" small onPress={() => openPaymentModal(item)} style={{ flex: 1 }} />
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.green} />}
    >
      <View style={[styles.container, baseStyles.webCenter]}>
        <BrandHeader
          title="My Book Loans"
          subtitle="Track due dates, penalties, and payment settlement"
          avatarUri={user?.profileImageUrl}
        />

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={[styles.eyebrow, { color: palette.green }]}>Book loan overview</Text>
              <Text style={[styles.heroTitle, { color: palette.gray800 }]}>Everything you need to manage your returns</Text>
              <Text style={[styles.heroText, { color: palette.gray500 }]}>
                Review your book loan calendar, check overdue items, and settle penalties from one screen.
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Icon name="calendar-outline" size={16} color={palette.green} />
              <Text style={[styles.heroBadgeText, { color: palette.green }]}>{monthTitle}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
              <Text style={[styles.summaryValue, { color: palette.gray800 }]}>{items.length}</Text>
              <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Requests</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
              <Text style={[styles.summaryValue, { color: palette.gray800 }]}>{activeCount}</Text>
              <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Active</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
              <Text style={[styles.summaryValue, { color: palette.gray800 }]}>{overdueCount}</Text>
              <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Overdue</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
              <Text style={[styles.summaryValue, { color: palette.gray800 }]}>₱{totalPenaltyDue.toFixed(2)}</Text>
              <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Due now</Text>
            </View>
          </View>
        </View>

        <View style={[styles.layout, isWide && styles.layoutWide]}>
          <View style={styles.mainColumn}>
            <Card style={styles.calendarCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Calendar</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Full month view</Text>
                </View>
                <View style={styles.calendarNav}>
                  <StyledButton
                    title="Prev"
                    small
                    variant="outline"
                    onPress={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  />
                  <StyledButton
                    title="Today"
                    small
                    variant="secondary"
                    onPress={() => {
                      const today = new Date();
                      setCurrentMonth(startOfMonth(today));
                      setSelectedDate(today);
                    }}
                  />
                  <StyledButton
                    title="Next"
                    small
                    variant="outline"
                    onPress={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  />
                </View>
              </View>

              <View style={styles.calendarMetaRow}>
                <Text style={[styles.calendarMonthLabel, { color: palette.gray800 }]}>{monthTitle}</Text>
                <Text style={[styles.calendarHint, { color: palette.gray500 }]}>Tap a day to inspect the due items for that date.</Text>
              </View>

              <View style={styles.selectedDayPanel}>
                <View style={styles.selectedDayHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectedDayKicker, { color: palette.green }]}>Selected Day</Text>
                    <Text style={[styles.selectedDayTitle, { color: palette.gray800 }]}>{selectedDayLabel}</Text>
                  </View>
                  <View style={styles.selectedDayBadge}>
                    <Text style={[styles.selectedDayBadgeText, { color: palette.green }]}>{selectedDayDueCount} due</Text>
                  </View>
                </View>
                {selectedDayDueCount ? (
                  <View style={styles.selectedDayPreviewList}>
                    {selectedDayBorrowings.slice(0, 3).map((item) => {
                      const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
                      return (
                        <View key={item._id} style={styles.selectedDayPreviewItem}>
                          <View style={[styles.detailIcon, { backgroundColor: cfg.bg }]}>
                            <Icon name={cfg.icon} size={16} color={cfg.color} />
                          </View>
                          <View style={styles.detailBody}>
                            <Text style={[styles.detailTitle, { color: palette.gray800 }]}>{item.bookId?.title || 'Book'}</Text>
                            <Text style={[styles.detailMeta, { color: palette.gray500 }]}>{item.status} · Due {formatShortDate(item.due_date)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[styles.emptyText, { color: palette.gray500 }]}>No book loans are due on this date.</Text>
                )}
              </View>

              <View style={styles.weekdayRow}>
                {daysOfWeek.map((day) => (
                  <Text key={day} style={[styles.weekdayLabel, { color: palette.gray500 }]}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((day) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isSelected = sameDay(day, selectedDate);
                  const isToday = sameDay(day, new Date());
                  const dueItemsForDay = items.filter((item) => item.due_date && sameDay(new Date(item.due_date), day));
                  const dueColor = dueItemsForDay.some((item) => item.status === 'Overdue')
                    ? palette.red
                    : dueItemsForDay.length > 0
                      ? palette.orange
                      : palette.green;

                  return (
                    <Pressable
                      key={day.toISOString()}
                      style={[
                        styles.dayCell,
                        { backgroundColor: palette.surface, borderColor: palette.gray100 },
                        !isCurrentMonth && styles.dayCellMuted,
                        isSelected && { backgroundColor: palette.greenLight, borderColor: palette.green },
                        isToday && { borderColor: palette.chestnut },
                      ]}
                      onPress={() => setSelectedDate(new Date(day))}
                    >
                      <Text style={[
                        styles.dayNumber,
                        { color: palette.gray800 },
                        !isCurrentMonth && { color: palette.gray400 },
                        isSelected && { color: palette.green },
                      ]}>
                        {day.getDate()}
                      </Text>
                      <View style={styles.dayIndicators}>
                        {dueItemsForDay.length > 0 ? (
                          <View style={[styles.dayDot, { backgroundColor: dueColor }]} />
                        ) : null}
                        {isToday ? (
                          <View style={styles.todayPill}>
                            <Icon name="calendar" size={12} color={palette.white} />
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Selected Day</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Book loans due on {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={[styles.sectionBadgeText, { color: palette.green }]}>{selectedDayBorrowings.length} items</Text>
                </View>
              </View>

              {selectedDayBorrowings.length ? (
                <View style={styles.detailList}>
                  {selectedDayBorrowings.map((item) => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
                    const isSettled = settledBorrowingIds.has(String(item._id));
                    return (
                      <View key={item._id} style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: cfg.bg }]}>
                          <Icon name={cfg.icon} size={16} color={cfg.color} />
                        </View>
                        <View style={styles.detailBody}>
                          <Text style={[styles.detailTitle, { color: palette.gray800 }]}>{item.bookId?.title || 'Book'}</Text>
                          <Text style={[styles.detailMeta, { color: palette.gray500 }]}>{item.status} · Due {formatShortDate(item.due_date)}</Text>
                        </View>
                        <Text style={[styles.detailBadge, isSettled ? { color: palette.green } : { color: cfg.color }]}>
                          {isSettled ? 'Settled' : `₱${Number(item.penaltyAmount || 0).toFixed(2)}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>No due items for the selected date.</Text>
              )}
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Book Loans</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>All your book loan requests and returns</Text>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator color={palette.chestnut} size="large" style={{ marginVertical: spacing.xl }} />
              ) : items.length ? (
                <View style={styles.borrowingList}>
                  {items.map(renderBorrowingCard)}
                </View>
              ) : (
                <EmptyState icon="library-outline" message="No book loan history yet." />
              )}
            </Card>
          </View>

          <View style={styles.sideColumn}>
            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Payment</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Settle your penalties</Text>
                </View>
              </View>
              <Text style={[styles.sideText, { color: palette.gray500 }]}>
                Overdue items can be settled directly from this page. Choose a record, confirm the amount, and submit the payment.
              </Text>
              <View style={styles.paymentSummaryRow}>
                <View style={[styles.paymentSummaryCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                  <Text style={[styles.summaryValue, { color: palette.gray800 }]}>{payments.length}</Text>
                  <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Settled</Text>
                </View>
                <View style={[styles.paymentSummaryCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                  <Text style={[styles.summaryValue, { color: palette.gray800 }]}>₱{totalPenaltyDue.toFixed(2)}</Text>
                  <Text style={[styles.summaryLabel, { color: palette.gray500 }]}>Outstanding</Text>
                </View>
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionKicker, { color: palette.green }]}>Payment History</Text>
                  <Text style={[styles.sectionTitle, { color: palette.gray800 }]}>Recent settlements</Text>
                </View>
              </View>
              {payments.length ? (
                <View style={styles.paymentList}>
                  {payments.slice(0, 6).map((payment) => (
                    <View key={payment._id} style={styles.paymentItem}>
                      <View style={styles.paymentLeft}>
                        <Text style={[styles.paymentAmount, { color: palette.gray800 }]}>₱{Number(payment.amount || 0).toFixed(2)}</Text>
                        <Text style={[styles.paymentMeta, { color: palette.gray500 }]}>
                          {payment.borrowingId?.bookId?.title || 'Book loan'}
                        </Text>
                      </View>
                      <View style={styles.paymentRight}>
                        <Text style={[styles.paymentMethod, { color: palette.green }]}>{payment.payment_method}</Text>
                        <Text style={[styles.paymentDate, { color: palette.gray400 }]}>{formatShortDate(payment.payment_date || payment.createdAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No payments recorded yet.</Text>
              )}
            </Card>
          </View>
        </View>
      </View>

      <Modal visible={paymentModalVisible} transparent animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPaymentModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]} onPress={() => null}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '100%' }}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalKicker, { color: palette.green }]}>Payment Settlement</Text>
                <Text style={[styles.modalTitle, { color: palette.gray800 }]}>{paymentTarget?.bookId?.title || 'Book loan'}</Text>
              </View>
              <Pressable onPress={() => setPaymentModalVisible(false)} style={styles.closeButton}>
                <Icon name="close-outline" size={18} color={palette.gray700} />
              </Pressable>
            </View>

            <Text style={[styles.modalText, { color: palette.gray500 }]}>
              Confirm the penalty amount and choose a payment method. The payment will be recorded in the system.
            </Text>

            <StyledInput
              label="Amount"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />

            <View style={styles.methodBlock}>
              <Text style={styles.methodLabel}>Payment Method</Text>
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

            <View style={styles.modalActions}>
              <StyledButton title="Cancel" variant="outline" onPress={() => setPaymentModalVisible(false)} style={{ flex: 1 }} />
              <StyledButton title="Submit Payment" variant="success" loading={paymentLoading} onPress={submitPayment} style={{ flex: 1 }} />
            </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (palette) => StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.gray100,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  eyebrow: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  heroTitle: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.gray800,
  },
  heroText: {
    ...fonts.sm,
    color: palette.gray500,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: palette.greenLight,
  },
  heroBadgeText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.gray100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.gray800,
  },
  summaryLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.gray500,
    marginTop: 2,
  },
  layout: {
    gap: spacing.lg,
  },
  layoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainColumn: {
    flex: 1.25,
    gap: spacing.lg,
  },
  sideColumn: {
    flex: 0.85,
    gap: spacing.lg,
  },
  calendarCard: {
    padding: spacing.md,
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
  calendarNav: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  calendarMetaRow: {
    marginBottom: spacing.md,
  },
  calendarMonthLabel: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
  },
  calendarHint: {
    ...fonts.sm,
    color: palette.gray500,
    marginTop: 2,
  },
  selectedDayPanel: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.gray100,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  selectedDayKicker: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  selectedDayTitle: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
  },
  selectedDayBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: palette.greenLight,
  },
  selectedDayBadgeText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
  },
  selectedDayPreviewList: {
    gap: spacing.xs,
  },
  selectedDayPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    width: '14.2857%',
    textAlign: 'center',
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.gray500,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.2857%',
    minHeight: 78,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.gray100,
    backgroundColor: palette.surface,
    padding: 6,
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dayCellMuted: {
    opacity: 0.45,
  },
  dayCellSelected: {
    borderColor: palette.green,
    backgroundColor: palette.greenLight,
  },
  dayCellToday: {
    borderColor: palette.chestnut,
  },
  dayNumber: {
    ...fonts.sm,
    ...fonts.bold,
    color: palette.gray800,
  },
  dayNumberMuted: {
    color: palette.gray400,
  },
  dayNumberSelected: {
    color: palette.green,
  },
  dayIndicators: {
    gap: 4,
    alignItems: 'flex-start',
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  todayPill: {
    backgroundColor: palette.chestnut,
    borderRadius: radii.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailList: {
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray100,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: {
    flex: 1,
    gap: 2,
  },
  detailTitle: {
    ...fonts.sm,
    ...fonts.semibold,
    color: palette.gray800,
  },
  detailMeta: {
    ...fonts.xs,
    color: palette.gray500,
  },
  detailBadge: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  emptyText: {
    ...fonts.sm,
    color: palette.gray500,
  },
  borrowingList: {
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
  },
  subtitle: {
    ...fonts.sm,
    color: palette.gray500,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusText: {
    ...fonts.xs,
    ...fonts.semibold,
  },
  detailsGrid: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  detailLabel: {
    ...fonts.sm,
    color: palette.gray400,
  },
  detailValue: {
    ...fonts.sm,
    ...fonts.semibold,
    color: palette.gray700,
  },
  penaltyValue: {
    color: palette.red,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  settledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.greenLight,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  settledText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
    flex: 1,
  },
  sideText: {
    ...fonts.sm,
    color: palette.gray500,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentSummaryCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.gray100,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  paymentList: {
    gap: spacing.sm,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray100,
  },
  paymentLeft: {
    flex: 1,
    gap: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  paymentAmount: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
  },
  paymentMeta: {
    ...fonts.xs,
    color: palette.gray500,
  },
  paymentMethod: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
  },
  paymentDate: {
    ...fonts.xs,
    color: palette.gray400,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  modalKicker: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalTitle: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.gray800,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: palette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    ...fonts.sm,
    color: palette.gray500,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  methodBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  methodLabel: {
    ...fonts.sm,
    ...fonts.semibold,
    color: palette.gray600,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  methodButton: {
    minWidth: 92,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
