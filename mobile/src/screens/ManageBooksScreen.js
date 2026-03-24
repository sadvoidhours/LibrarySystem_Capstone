import React, { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { baseStyles, fonts, palette, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';
import EmptyState from '../components/EmptyState';

export default function ManageBooksScreen() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ title: '', author: '', category: '', available_copies: '1', barcodeString: '' });

  const load = async () => {
    const { data } = await api.get('/books');
    setBooks(data.items);
  };

  useEffect(() => {
    load().catch(() => null);
  }, []);

  const addBook = async () => {
    try {
      await api.post('/books', { ...form, available_copies: Number(form.available_copies) });
      setForm({ title: '', author: '', category: '', available_copies: '1', barcodeString: '' });
      load();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add book');
    }
  };

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const renderItem = ({ item }) => (
    <Card style={styles.bookCard}>
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.meta}>{item.author}</Text>
      <Text style={styles.meta}>Copies: {item.available_copies}</Text>
    </Card>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.screen}>
        <View style={[styles.container, baseStyles.webCenter]}>
          <BrandHeader title="Catalog Management" subtitle="Add and maintain book records" />

          <Card>
            <Text style={styles.sectionTitle}>Add New Book</Text>
            <View style={styles.formGap}>
              <StyledInput label="Title" placeholder="Book title" value={form.title} onChangeText={(v) => update('title', v)} />
              <StyledInput label="Author" placeholder="Author name" value={form.author} onChangeText={(v) => update('author', v)} />
              <StyledInput label="Category" placeholder="Category" value={form.category} onChangeText={(v) => update('category', v)} />
              <View style={styles.row}>
                <StyledInput label="Copies" placeholder="1" keyboardType="numeric" value={form.available_copies} onChangeText={(v) => update('available_copies', v)} containerStyle={{ flex: 1 }} />
                <StyledInput label="Barcode" placeholder="Barcode" value={form.barcodeString} onChangeText={(v) => update('barcodeString', v)} containerStyle={{ flex: 1 }} />
              </View>
              <StyledButton title="Add Book" onPress={addBook} />
            </View>
          </Card>

          <FlatList
            data={books}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState icon="book-outline" message="No books in catalog." />}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  sectionTitle: { ...fonts.base, ...fonts.bold, color: palette.gray700, marginBottom: spacing.sm },
  formGap: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  bookCard: { padding: spacing.md, gap: spacing.xs },
  bookTitle: { ...fonts.base, ...fonts.bold, color: palette.gray800 },
  meta: { ...fonts.sm, color: palette.gray500 },
});
