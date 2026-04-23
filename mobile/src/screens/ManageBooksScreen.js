import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import api from '../api/client';
import { baseStyles, createBaseStyles, fonts, getThemePalette, radii, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';
import EmptyState from '../components/EmptyState';

export default function ManageBooksScreen() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const dynamicBaseStyles = useMemo(() => createBaseStyles(palette), [palette]);

  const [books, setBooks] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [editingBookId, setEditingBookId] = useState(null);
  const [frontCoverLoading, setFrontCoverLoading] = useState(false);
  const [backCoverLoading, setBackCoverLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publication_year: '',
    total_copies: '1',
    available_copies: '1',
    coverImageUrl: '',
    backCoverImageUrl: '',
    barcodeString: ''
  });

  const resetForm = () => {
    setEditingBookId(null);
    setForm({
      title: '',
      author: '',
      isbn: '',
      category: '',
      publication_year: '',
      total_copies: '1',
      available_copies: '1',
      coverImageUrl: '',
      backCoverImageUrl: '',
      barcodeString: ''
    });
  };

  const load = async () => {
    const [{ data: booksData }, { data: borrowingData }] = await Promise.all([
      api.get('/books'),
      api.get('/reports/borrowings'),
    ]);

    setBooks(booksData.items);
    setBorrowings(borrowingData);
  };

  useEffect(() => {
    load().catch(() => null);
  }, []);

  const addBook = async () => {
    try {
      const payload = {
        ...form,
        publication_year: form.publication_year ? Number(form.publication_year) : null,
        total_copies: Number(form.total_copies),
        available_copies: Number(form.available_copies)
      };

      if (editingBookId) {
        await api.put(`/books/${editingBookId}`, payload);
      } else {
        await api.post('/books', payload);
      }

      resetForm();
      load();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save book');
    }
  };

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const booksWithBorrowers = useMemo(() => {
    return books.map((book) => {
      const currentBorrowers = borrowings.filter((borrowing) => String(borrowing.bookId?._id || borrowing.bookId) === String(book._id) && ['Pending', 'Active', 'Overdue'].includes(borrowing.status));

      return {
        ...book,
        currentBorrowers,
      };
    });
  }, [books, borrowings]);

  const uploadBookCover = async (field, folderSuffix) => {
    const setLoading = field === 'coverImageUrl' ? setFrontCoverLoading : setBackCoverLoading;

    const handleUpload = async ({ uri, name, type, file }) => {
      setLoading(true);

      try {
        const formData = new FormData();

        if (Platform.OS === 'web') {
          const webFile = file || await fetch(uri).then((response) => response.blob());
          const fileObject = webFile instanceof File ? webFile : new File([webFile], name, { type });
          formData.append('image', fileObject, name);
        } else {
          formData.append('image', {
            uri,
            name,
            type,
          });
        }

        const { data } = await api.post(`/uploads/image?folder=ptc-library/book-covers/${folderSuffix}`, formData);
        update(field, data.url);
      } catch (error) {
        Alert.alert('Upload failed', error.response?.data?.message || 'Unable to upload cover image');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) {
          return;
        }

        const fileName = selectedFile.name || `${field}-${Date.now()}.jpg`;
        await handleUpload({
          uri: URL.createObjectURL(selectedFile),
          name: fileName,
          type: selectedFile.type || 'image/jpeg',
          file: selectedFile,
        });
      };

      input.click();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [2, 3],
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return;
    }

    const filename = asset.fileName || `${field}-${Date.now()}.jpg`;
    const extensionMatch = filename.match(/\.(\w+)$/);
    const fileType = asset.mimeType || `image/${extensionMatch ? extensionMatch[1] : 'jpeg'}`;
    await handleUpload({ uri: asset.uri, name: filename, type: fileType, file: asset.file });
  };

  const startEdit = (item) => {
    setEditingBookId(item._id);
    setForm({
      title: item.title || '',
      author: item.author || '',
      isbn: item.isbn || '',
      category: item.category || '',
      publication_year: item.publication_year ? String(item.publication_year) : '',
      total_copies: String(item.total_copies ?? item.available_copies ?? 1),
      available_copies: String(item.available_copies ?? item.total_copies ?? 1),
      coverImageUrl: item.coverImageUrl || '',
      backCoverImageUrl: item.backCoverImageUrl || '',
      barcodeString: item.barcodeString || ''
    });
  };

  const renderItem = ({ item }) => (
    <Card style={styles.bookCard}>
      <View style={styles.previewRow}>
        <View style={styles.coverStack}>
          {item.coverImageUrl ? <Image source={{ uri: item.coverImageUrl }} style={styles.coverImage} /> : <View style={[styles.coverImage, styles.coverFallback]} />}
          <Text style={[styles.previewLabel, { color: palette.gray500 }]}>Front</Text>
        </View>
        <View style={styles.coverStack}>
          {item.backCoverImageUrl ? <Image source={{ uri: item.backCoverImageUrl }} style={styles.coverImage} /> : <View style={[styles.coverImage, styles.coverFallback]} />}
          <Text style={[styles.previewLabel, { color: palette.gray500 }]}>Back</Text>
        </View>
      </View>
      <Text style={[styles.bookTitle, { color: palette.gray800 }]}>{item.title}</Text>
      <Text style={[styles.meta, { color: palette.gray500 }]}>{item.author}</Text>
      <Text style={[styles.meta, { color: palette.gray500 }]} numberOfLines={1}>ISBN: {item.isbn || 'N/A'}</Text>
      <Text style={[styles.meta, { color: palette.gray500 }]}>Year: {item.publication_year || 'N/A'}</Text>
      <Text style={[styles.meta, { color: palette.gray500 }]}>Copies: {item.available_copies}/{item.total_copies || item.available_copies}</Text>
      <View style={styles.borrowerBlock}>
        <Text style={[styles.borrowerLabel, { color: palette.gray500 }]}>Borrowed by</Text>
        {item.currentBorrowers?.length ? (
          item.currentBorrowers.slice(0, 3).map((borrowing) => (
            <Text key={borrowing._id} style={[styles.borrowerText, { color: palette.gray700 }]} numberOfLines={1}>
              {borrowing.userId?.name || 'Unknown borrower'} · {borrowing.status}
            </Text>
          ))
        ) : (
          <Text style={[styles.borrowerText, { color: palette.gray500 }]}>No current borrower</Text>
        )}
      </View>
      <StyledButton title="Edit Book" variant="outline" small onPress={() => startEdit(item)} />
    </Card>
  );

  const renderHeader = () => (
    <>
      <BrandHeader title="Catalog Management" subtitle="Add and maintain book records" />

      <Card>
        <Text style={[styles.sectionTitle, { color: palette.gray700 }]}>{editingBookId ? 'Edit Book' : 'Add New Book'}</Text>
        <View style={styles.formGap}>
          <StyledInput label="Title" placeholder="Book title" value={form.title} onChangeText={(v) => update('title', v)} />
          <StyledInput label="Author" placeholder="Author name" value={form.author} onChangeText={(v) => update('author', v)} />
          <StyledInput label="ISBN" placeholder="ISBN" value={form.isbn} onChangeText={(v) => update('isbn', v)} />
          <StyledInput label="Category" placeholder="Category" value={form.category} onChangeText={(v) => update('category', v)} />
          <StyledInput label="Publication Year" placeholder="2026" keyboardType="numeric" value={form.publication_year} onChangeText={(v) => update('publication_year', v)} />
          <View style={styles.row}>
            <StyledInput label="Total Copies" placeholder="1" keyboardType="numeric" value={form.total_copies} onChangeText={(v) => update('total_copies', v)} containerStyle={{ flex: 1 }} />
            <StyledInput label="Available Copies" placeholder="1" keyboardType="numeric" value={form.available_copies} onChangeText={(v) => update('available_copies', v)} containerStyle={{ flex: 1 }} />
          </View>
          <View style={styles.coverUploadGrid}>
            <Pressable style={styles.coverUploadCard} onPress={() => uploadBookCover('coverImageUrl', 'front')}>
              <View style={[styles.coverPreviewShell, { borderColor: palette.gray200, backgroundColor: palette.surfaceAlt }]}>
                {form.coverImageUrl ? <Image source={{ uri: form.coverImageUrl }} style={styles.coverPreview} /> : <Text style={[styles.coverPreviewText, { color: palette.gray500 }]}>Front cover</Text>}
              </View>
              <StyledButton title={frontCoverLoading ? 'Uploading...' : 'Choose Front Cover'} small variant="outline" onPress={() => uploadBookCover('coverImageUrl', 'front')} />
            </Pressable>
            <Pressable style={styles.coverUploadCard} onPress={() => uploadBookCover('backCoverImageUrl', 'back')}>
              <View style={[styles.coverPreviewShell, { borderColor: palette.gray200, backgroundColor: palette.surfaceAlt }]}>
                {form.backCoverImageUrl ? <Image source={{ uri: form.backCoverImageUrl }} style={styles.coverPreview} /> : <Text style={[styles.coverPreviewText, { color: palette.gray500 }]}>Back cover</Text>}
              </View>
              <StyledButton title={backCoverLoading ? 'Uploading...' : 'Choose Back Cover'} small variant="outline" onPress={() => uploadBookCover('backCoverImageUrl', 'back')} />
            </Pressable>
          </View>
          <View style={styles.row}>
            <StyledInput
              label="Barcode (optional)"
              placeholder="Auto-generated if left blank"
              value={form.barcodeString}
              onChangeText={(v) => update('barcodeString', v)}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <View style={styles.actionRow}>
            {editingBookId ? <StyledButton title="Cancel Edit" variant="outline" onPress={resetForm} style={{ flex: 1 }} /> : null}
            <StyledButton title={editingBookId ? 'Save Changes' : 'Add Book'} onPress={addBook} style={{ flex: 1 }} />
          </View>
        </View>
      </Card>
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
          <FlatList
            data={booksWithBorrowers}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            style={styles.listView}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={<EmptyState icon="book-outline" message="No books in catalog." />}
          />
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (p) => StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  sectionTitle: { ...fonts.base, ...fonts.bold, marginBottom: spacing.sm },
  formGap: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  list: { gap: spacing.sm, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  listView: { flex: 1 },
  bookCard: { padding: spacing.md, gap: spacing.xs },
  previewRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  coverStack: { flex: 1, gap: 4, alignItems: 'center' },
  coverImage: { width: '100%', aspectRatio: 0.65, borderRadius: radii.md, backgroundColor: p.gray100 },
  coverFallback: { backgroundColor: p.yellowSoft },
  previewLabel: { ...fonts.xs, ...fonts.semibold, textTransform: 'uppercase' },
  coverUploadGrid: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  coverUploadCard: { flex: 1, minWidth: 150, gap: spacing.sm },
  coverPreviewShell: {
    height: 180,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  coverPreview: { width: '100%', height: '100%' },
  coverPreviewText: { ...fonts.sm, ...fonts.semibold },
  bookTitle: { ...fonts.base, ...fonts.bold },
  meta: { ...fonts.sm },
  borrowerBlock: { gap: 2, paddingVertical: spacing.xs },
  borrowerLabel: {
    ...fonts.xs,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  borrowerText: {
    ...fonts.sm,
  },
});
