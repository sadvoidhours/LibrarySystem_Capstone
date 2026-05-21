import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  const [isbnScannerVisible, setIsbnScannerVisible] = useState(false);
  const [scanStatus, setScanStatus] = useState('Ready to scan ISBN barcode.');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    edition: '',
    publisher: '',
    place_of_publication: '',
    isbn: '',
    format: '',
    physical_description: '',
    subject_headings: '',
    language: '',
    shelf_location: '',
    notes: '',
    date_added: '',
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
    setIsbnScannerVisible(false);
    scanLockRef.current = false;
    setForm({
      title: '',
      author: '',
      edition: '',
      publisher: '',
      place_of_publication: '',
      isbn: '',
      format: '',
      physical_description: '',
      subject_headings: '',
      language: '',
      shelf_location: '',
      notes: '',
      date_added: '',
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

  const normalizeSubjectHeadingsInput = (value) => {
    if (!value) {
      return [];
    }

    return String(value)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  };

  const toNumberOrUndefined = (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const addBook = async () => {
    try {
      const payload = {
        ...form,
        subject_headings: normalizeSubjectHeadingsInput(form.subject_headings),
        total_copies: toNumberOrUndefined(form.total_copies),
        available_copies: toNumberOrUndefined(form.available_copies)
      };

      const publicationYear = toNumberOrUndefined(form.publication_year);
      if (publicationYear !== undefined) {
        payload.publication_year = publicationYear;
      } else {
        delete payload.publication_year;
      }

      if (payload.total_copies === undefined) {
        delete payload.total_copies;
      }

      if (payload.available_copies === undefined) {
        delete payload.available_copies;
      }

      if (!payload.date_added) {
        delete payload.date_added;
      }

      if (!payload.barcodeString) {
        delete payload.barcodeString;
      }

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

  const applyLookupData = (bookData) => {
    if (!bookData) {
      return;
    }

    setForm((current) => ({
      ...current,
      title: bookData.title || current.title,
      author: bookData.author || current.author,
      edition: bookData.edition || current.edition,
      publisher: bookData.publisher || current.publisher,
      place_of_publication: bookData.place_of_publication || current.place_of_publication,
      isbn: bookData.isbn || current.isbn,
      format: bookData.format || current.format,
      physical_description: bookData.physical_description || current.physical_description,
      subject_headings: Array.isArray(bookData.subject_headings)
        ? bookData.subject_headings.join(', ')
        : bookData.subject_headings || current.subject_headings,
      language: bookData.language || current.language,
      shelf_location: bookData.shelf_location || current.shelf_location,
      notes: bookData.notes || current.notes,
      category: bookData.category || current.category,
      publication_year: bookData.publication_year ? String(bookData.publication_year) : current.publication_year,
      coverImageUrl: bookData.coverImageUrl || current.coverImageUrl,
      backCoverImageUrl: bookData.backCoverImageUrl || current.backCoverImageUrl,
      barcodeString: bookData.barcodeString || current.barcodeString,
    }));
  };

  const lookupBookDetails = async (isbnValue) => {
    const normalizedIsbn = String(isbnValue || '').trim();

    if (!normalizedIsbn) {
      Alert.alert('Missing ISBN', 'Enter or scan an ISBN first.');
      return;
    }

    try {
      setLookupLoading(true);
      const { data } = await api.get('/books/lookup', { params: { isbn: normalizedIsbn } });
      applyLookupData(data.book);
      setScanStatus(`Details loaded from ${data.source === 'library' ? 'library records' : 'web search'}.`);
    } catch (error) {
      Alert.alert('Lookup failed', error.response?.data?.message || 'Unable to find book details for that ISBN');
      setScanStatus('No details found for that ISBN yet.');
    } finally {
      setLookupLoading(false);
    }
  };

  const enableIsbnScanner = async () => {
    // On web, use a file-capture + BarcodeDetector fallback because
    // expo-camera barcode scanning is not reliably supported in browsers.
    if (Platform.OS === 'web') {
      return webScanBarcode();
    }

    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to scan the book barcode.');
        return;
      }
    }

    scanLockRef.current = false;
    setScanStatus('Scanning ISBN barcode...');
    setIsbnScannerVisible(true);
  };

  const webScanBarcode = async () => {
    try {
      setScanStatus('Preparing camera...');

      // Create a hidden file input to trigger camera capture on mobile browsers
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          setScanStatus('No image selected');
          return;
        }

        setScanStatus('Detecting barcode from image...');

        try {
          // Use the native Barcode Detector API when available
          if (window.BarcodeDetector) {
            const bitmap = await createImageBitmap(file);
            const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'];
            const detector = new window.BarcodeDetector({ formats });
            const detections = await detector.detect(bitmap);

            if (detections && detections.length > 0) {
              handleIsbnScan({ data: detections[0].rawValue });
              setScanStatus(`ISBN captured: ${detections[0].rawValue}`);
              return;
            }
          }

          setScanStatus('No barcode detected in the photo.');
        } catch (err) {
          // Browser may not support createImageBitmap or BarcodeDetector
          console.error('webScanBarcode error', err);
          setScanStatus('Unable to detect barcode on this browser.');
        }
      };

      input.click();
    } catch (err) {
      console.error('webScanBarcode init error', err);
      setScanStatus('Failed to start web scanner');
    }
  };

  const handleIsbnScan = ({ data }) => {
    if (scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;
    const scannedValue = String(data || '').trim();

    if (scannedValue) {
      update('isbn', scannedValue);
      setScanStatus(`ISBN captured: ${scannedValue}`);
      lookupBookDetails(scannedValue).catch(() => null);
    }

    setIsbnScannerVisible(false);

    setTimeout(() => {
      scanLockRef.current = false;
    }, 600);
  };

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
      edition: item.edition || '',
      publisher: item.publisher || '',
      place_of_publication: item.place_of_publication || '',
      isbn: item.isbn || '',
      format: item.format || '',
      physical_description: item.physical_description || '',
      subject_headings: Array.isArray(item.subject_headings) ? item.subject_headings.join(', ') : item.subject_headings || '',
      language: item.language || '',
      shelf_location: item.shelf_location || '',
      notes: item.notes || '',
      date_added: item.date_added ? String(item.date_added).slice(0, 10) : '',
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
      <Text style={[styles.meta, { color: palette.gray500 }]} numberOfLines={1}>Shelf: {item.shelf_location || 'Unassigned'}</Text>
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
      <StyledButton title="Edit Book" variant="primary" small onPress={() => startEdit(item)} style={styles.editButton} />
    </Card>
  );

  const renderHeader = () => (
    <>
      <BrandHeader title="Catalog Management" subtitle="Add and maintain book records" />

      <Card>
        <Text style={[styles.sectionTitle, { color: palette.gray700 }]}>{editingBookId ? 'Edit Book' : 'Add New Book'}</Text>
        <View style={styles.formGap}>
          <StyledInput label="Title" placeholder="Title" value={form.title} onChangeText={(v) => update('title', v)} />
          <StyledInput label="Author" placeholder="Author" value={form.author} onChangeText={(v) => update('author', v)} />
          <StyledInput label="Edition" placeholder="First edition" value={form.edition} onChangeText={(v) => update('edition', v)} />
          <StyledInput label="Publisher" placeholder="Publisher" value={form.publisher} onChangeText={(v) => update('publisher', v)} />
          <StyledInput label="Place of Publication" placeholder="City, Country" value={form.place_of_publication} onChangeText={(v) => update('place_of_publication', v)} />
          <View style={styles.isbnRow}>
            <StyledInput
              label="ISBN"
              placeholder="Scan or type ISBN"
              value={form.isbn}
              onChangeText={(v) => update('isbn', v)}
              containerStyle={{ flex: 1 }}
            />
            <StyledButton title="Scan" variant="outlineGreen" small onPress={enableIsbnScanner} style={styles.scanButton} />
            <StyledButton
              title={lookupLoading ? 'Searching...' : 'Auto-fill'}
              variant="success"
              small
              onPress={() => lookupBookDetails(form.isbn)}
              style={styles.scanButton}
              loading={lookupLoading}
            />
          </View>
          <View style={styles.row}>
            <StyledInput label="Language" placeholder="English" value={form.language} onChangeText={(v) => update('language', v)} containerStyle={{ flex: 1 }} />
            <StyledInput label="Format" placeholder="Print" value={form.format} onChangeText={(v) => update('format', v)} containerStyle={{ flex: 1 }} />
          </View>
          <StyledInput
            label="Physical Description"
            placeholder="e.g., 320 pages, illustrated"
            value={form.physical_description}
            onChangeText={(v) => update('physical_description', v)}
            multiline
            style={{ height: 88, textAlignVertical: 'top' }}
          />
          <StyledInput
            label="Subject Headings / Keywords"
            placeholder="history, literature, filipino"
            value={form.subject_headings}
            onChangeText={(v) => update('subject_headings', v)}
          />
          <View style={styles.row}>
            <StyledInput label="Shelf Location" placeholder="Aisle 2 - Shelf B" value={form.shelf_location} onChangeText={(v) => update('shelf_location', v)} containerStyle={{ flex: 1 }} />
            <StyledInput label="Date Added" placeholder="YYYY-MM-DD" value={form.date_added} onChangeText={(v) => update('date_added', v)} containerStyle={{ flex: 1 }} />
          </View>
          <StyledInput
            label="Notes"
            placeholder="Additional notes"
            value={form.notes}
            onChangeText={(v) => update('notes', v)}
            multiline
            style={{ height: 96, textAlignVertical: 'top' }}
          />
          <StyledInput label="Category" placeholder="Category" value={form.category} onChangeText={(v) => update('category', v)} />
          <StyledInput label="Year of Publication" placeholder="2026" keyboardType="numeric" value={form.publication_year} onChangeText={(v) => update('publication_year', v)} />
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
              placeholder="Auto-generated"
              value={form.barcodeString}
              onChangeText={(v) => update('barcodeString', v)}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <View style={styles.actionRow}>
            {editingBookId ? <StyledButton title="Cancel Edit" variant="outline" onPress={resetForm} style={{ flex: 1 }} /> : null}
            <StyledButton title={editingBookId ? 'Save Changes' : 'Add Book'} onPress={addBook} style={{ flex: 1 }} />
          </View>
          <Text style={[styles.scanHint, { color: palette.gray500 }]}>{scanStatus}</Text>
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

          <Modal visible={isbnScannerVisible} transparent animationType="fade" onRequestClose={() => setIsbnScannerVisible(false)}>
            <Pressable style={styles.scannerBackdrop} onPress={() => setIsbnScannerVisible(false)}>
              <Pressable onPress={() => null} style={[styles.scannerCard, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
                <Text style={[styles.scannerTitle, { color: palette.gray800 }]}>Scan ISBN Barcode</Text>
                <Text style={[styles.scannerSubtitle, { color: palette.gray500 }]}>Point the camera at the ISBN barcode on the book cover.</Text>

                <View style={styles.scannerPreview}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
                    }}
                    onBarcodeScanned={handleIsbnScan}
                  />
                  <View style={styles.scannerOverlay}>
                    <ActivityIndicator color={palette.white} />
                    <Text style={styles.scannerOverlayText}>Scanning ISBN...</Text>
                  </View>
                </View>

                <View style={styles.scannerActions}>
                  <StyledButton title="Close" variant="outline" onPress={() => setIsbnScannerVisible(false)} style={{ flex: 1 }} />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (p) => StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  sectionTitle: { ...fonts.base, ...fonts.bold, marginBottom: spacing.sm, letterSpacing: 0.2 },
  formGap: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm },
  isbnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  scanButton: { minWidth: 100 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  scanHint: { ...fonts.xs, lineHeight: 16 },
  list: { gap: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  listView: { flex: 1 },
  bookCard: { padding: spacing.lg, gap: spacing.sm },
  previewRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  coverStack: { flex: 1, gap: 4, alignItems: 'center' },
  coverImage: { width: '100%', aspectRatio: 0.65, borderRadius: radii.md, backgroundColor: p.gray100 },
  coverFallback: { backgroundColor: p.yellowSoft },
  previewLabel: { ...fonts.xs, ...fonts.semibold, textTransform: 'uppercase' },
  coverUploadGrid: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  coverUploadCard: { flex: 1, minWidth: 150, gap: spacing.md },
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
  editButton: { alignSelf: 'flex-start' },
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
  scannerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: spacing.lg,
    justifyContent: 'center',
  },
  scannerCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  scannerTitle: {
    ...fonts.lg,
    ...fonts.bold,
  },
  scannerSubtitle: {
    ...fonts.sm,
    lineHeight: 20,
  },
  scannerPreview: {
    height: 280,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  scannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    gap: 6,
  },
  scannerOverlayText: {
    ...fonts.sm,
    ...fonts.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scannerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
