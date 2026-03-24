import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import { fetchBooks } from '../store/slices/booksSlice';
import { baseStyles, fonts, getThemePalette, palette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';
import EmptyState from '../components/EmptyState';

export default function CatalogScreen() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.books);
  const user = useSelector((state) => state.auth.user);
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const themePalette = getThemePalette(themeMode);
  const [q, setQ] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [availability, setAvailability] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isModalWide = width >= 900;
  const numColumns = isWide ? 2 : 1;

  useEffect(() => {
    dispatch(fetchBooks({ limit: 1000 }));
  }, [dispatch]);

  const categories = ['All', ...new Set(items.map((book) => book.category).filter(Boolean))];

  const filteredItems = items.filter((book) => {
    const matchesQuery = !q.trim()
      || `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(q.trim().toLowerCase());
    const matchesCategory = activeCategory === 'All' || book.category === activeCategory;
    const matchesAvailability =
      availability === 'all'
      || (availability === 'available' && Number(book.available_copies) > 0)
      || (availability === 'unavailable' && Number(book.available_copies) < 1);

    return matchesQuery && matchesCategory && matchesAvailability;
  });

  const resetFilters = () => {
    setQ('');
    setActiveCategory('All');
    setAvailability('all');
  };

  const requestBorrow = async (bookId) => {
    await api.post('/borrowings/request', { bookId });
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.bookCard, numColumns > 1 && styles.bookCardWide]}>
      <View style={styles.bookRow}>
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverLetter}>{(item.title || 'B')[0]}</Text>
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.metaText}>{item.author}</Text>
          <Text style={styles.metaText}>{item.category}</Text>
          <View style={styles.availRow}>
            <View style={[styles.badge, item.available_copies > 0 ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={styles.badgeText}>
                {item.available_copies > 0 ? `${item.available_copies} avail.` : 'Unavailable'}
              </Text>
            </View>
          </View>
          <StyledButton
            title="Request Borrow"
            variant="success"
            small
            onPress={() => requestBorrow(item._id)}
            disabled={item.available_copies < 1}
          />
          <StyledButton
            title="View Details"
            variant="outline"
            small
            onPress={() => setSelectedBook(item)}
          />
        </View>
      </View>
    </Card>
  );

  const header = (
    <View>
      <BrandHeader
        title="Book Catalog"
        subtitle="Search by title, author, or category"
        avatarUri={user?.profileImageUrl}
      />

      <View style={[styles.heroCard, { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroKicker}>Collection</Text>
            <Text style={styles.heroTitle}>Discover books faster</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="library-outline" size={14} color={palette.green} />
            <Text style={styles.heroBadgeText}>{items.length} titles</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Search the catalog, review availability, and open any book for full details.
        </Text>
      </View>

      <View style={[styles.searchCard, { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 }]}>
        <View style={styles.searchRow}>
          <StyledInput
            placeholder="Search title, author, or category..."
            value={q}
            onChangeText={setQ}
            containerStyle={{ flex: 1 }}
          />
          <StyledButton
            title={showFilters ? 'Hide Filters' : 'Show Filters'}
            small
            variant="outline"
            onPress={() => setShowFilters((prev) => !prev)}
          />
        </View>

        {showFilters ? (
          <View style={styles.filtersWrap}>
            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.chipRow}>
                {categories.map((category) => (
                  <StyledButton
                    key={category}
                    title={category}
                    small
                    variant={activeCategory === category ? 'primary' : 'secondary'}
                    onPress={() => setActiveCategory(category)}
                    style={styles.chipButton}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Availability</Text>
              <View style={styles.chipRow}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'available', label: 'Available' },
                  { key: 'unavailable', label: 'Unavailable' },
                ].map((option) => (
                  <StyledButton
                    key={option.key}
                    title={option.label}
                    small
                    variant={availability === option.key ? 'primary' : 'secondary'}
                    onPress={() => setAvailability(option.key)}
                    style={styles.chipButton}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterFooter}>
              <Text style={styles.resultText}>{filteredItems.length} results</Text>
              <StyledButton title="Clear Filters" small variant="outline" onPress={resetFilters} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );

  const detailModal = selectedBook ? (
    <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedBook(null)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setSelectedBook(null)}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: themePalette.surface, borderColor: themePalette.gray100 },
            isModalWide && styles.modalCardWide,
          ]}
          onPress={() => null}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2}>{selectedBook.title}</Text>
            <Pressable onPress={() => setSelectedBook(null)} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={palette.gray700} />
            </Pressable>
          </View>

          <View style={[styles.modalBody, isModalWide && styles.modalBodyWide]}>
            {selectedBook.coverImageUrl ? (
              <Image source={{ uri: selectedBook.coverImageUrl }} style={styles.modalCover} />
            ) : (
              <View style={[styles.modalCover, styles.coverPlaceholder, styles.modalCoverPlaceholder]}>
                <Text style={styles.coverLetter}>{(selectedBook.title || 'B')[0]}</Text>
              </View>
            )}

            <View style={styles.modalInfo}>
              <Text style={styles.modalMeta}>{selectedBook.author}</Text>
              <Text style={styles.modalMeta}>{selectedBook.category || 'Uncategorized'}</Text>
              <Text style={styles.modalMeta}>ISBN: {selectedBook.isbn || 'N/A'}</Text>
              <Text style={styles.modalMeta}>Barcode: {selectedBook.barcodeString}</Text>
              <View style={styles.modalBadgeRow}>
                <View style={[styles.badge, Number(selectedBook.available_copies) > 0 ? styles.badgeGreen : styles.badgeRed]}>
                  <Text style={styles.badgeText}>
                    {Number(selectedBook.available_copies) > 0 ? `${selectedBook.available_copies} avail.` : 'Unavailable'}
                  </Text>
                </View>
              </View>
              <Text style={styles.modalDescription}>
                This record is available in the catalog and can be requested directly from this view.
              </Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            <StyledButton title="Close" variant="outline" onPress={() => setSelectedBook(null)} style={{ flex: 1 }} />
            <StyledButton
              title="Request Borrow"
              variant="success"
              onPress={() => {
                setSelectedBook(null);
                requestBorrow(selectedBook._id);
              }}
              disabled={selectedBook.available_copies < 1}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: themePalette.background }]}>
      <View style={[styles.container, baseStyles.webCenter]}>
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState icon="book-outline" message="No books found." />}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrap : null}
        />
        {loading ? (
          <ActivityIndicator color={palette.chestnut} size="large" style={styles.loading} />
        ) : (
          null
        )}
      </View>
      {detailModal}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  heroCard: {
    backgroundColor: palette.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.gray100,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  heroKicker: {
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
  searchCard: {
    marginBottom: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.gray100,
    ...shadows.sm,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: spacing.md,
        zIndex: 15,
      },
      default: {},
    }),
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  filterBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipButton: {
    minHeight: 34,
  },
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  resultText: {
    ...fonts.sm,
    ...fonts.semibold,
    color: palette.gray600,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  bookCard: {
    padding: spacing.md,
  },
  bookCardWide: {
    flex: 1,
  },
  bookRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cover: {
    width: 70,
    height: 100,
    borderRadius: radii.md,
    backgroundColor: palette.gray100,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.yellowSoft,
  },
  coverLetter: {
    ...fonts.xl,
    ...fonts.bold,
    color: palette.chestnut,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  bookTitle: {
    ...fonts.md,
    ...fonts.bold,
    color: palette.gray800,
  },
  metaText: {
    ...fonts.sm,
    color: palette.gray500,
  },
  availRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeGreen: {
    backgroundColor: palette.greenLight,
  },
  badgeRed: {
    backgroundColor: palette.redLight,
  },
  badgeText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.gray700,
  },
  columnWrap: {
    gap: spacing.sm,
  },
  loading: {
    marginTop: spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: palette.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    ...shadows.lg,
  },
  modalCardWide: {
    maxWidth: 940,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  modalBodyWide: {
    alignItems: 'flex-start',
  },
    marginBottom: spacing.md,
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
  modalBody: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  modalCover: {
    width: 160,
    height: 220,
    borderRadius: radii.lg,
    backgroundColor: palette.gray100,
  },
  modalCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInfo: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 220,
  },
  modalMeta: {
    ...fonts.sm,
    color: palette.gray600,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  modalDescription: {
    ...fonts.sm,
    color: palette.gray500,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
});
