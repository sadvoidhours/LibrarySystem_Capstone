import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../api/client';
import { baseStyles, fonts, palette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';

export default function ScannerScreen() {
  const [userBarcode, setUserBarcode] = useState('');
  const [bookBarcode, setBookBarcode] = useState('');
  const [scanTarget, setScanTarget] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const borrow = async () => {
    try {
      await api.post('/borrowings/scan/borrow', { userBarcode, bookBarcode });
      Alert.alert('Success', 'Borrow transaction completed.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Borrow failed');
    }
  };

  const returnBook = async () => {
    try {
      await api.post('/borrowings/scan/return', { userBarcode, bookBarcode });
      Alert.alert('Success', 'Return transaction completed.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Return failed');
    }
  };

  const enableScanner = async (target) => {
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to scan barcodes.');
        return;
      }
    }
    setScanTarget(target);
  };

  const onScan = ({ data }) => {
    if (scanTarget === 'user') setUserBarcode(data);
    if (scanTarget === 'book') setBookBarcode(data);
    setScanTarget(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, baseStyles.webCenter]}>
          <BrandHeader title="Scanner Circulation" subtitle="Scan user and book barcodes" />

          {scanTarget && (
            <View style={styles.scannerWrap}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'code128', 'ean13', 'ean8', 'upc_a', 'upc_e'],
                }}
                onBarcodeScanned={onScan}
              />
              <View style={styles.scanOverlay}>
                <Text style={styles.scanLabel}>Scanning {scanTarget} barcode...</Text>
              </View>
            </View>
          )}

          <View style={styles.scanButtons}>
            <StyledButton
              title="Scan User"
              variant="outline"
              small
              onPress={() => enableScanner('user')}
              style={{ flex: 1 }}
            />
            <StyledButton
              title="Scan Book"
              variant="outline"
              small
              onPress={() => enableScanner('book')}
              style={{ flex: 1 }}
            />
          </View>

          <Card>
            <Text style={styles.sectionTitle}>Manual Entry</Text>
            <View style={styles.formGap}>
              <StyledInput label="User Barcode" placeholder="User barcode" value={userBarcode} onChangeText={setUserBarcode} />
              <StyledInput label="Book Barcode" placeholder="Book barcode" value={bookBarcode} onChangeText={setBookBarcode} />
            </View>
          </Card>

          <View style={styles.actionRow}>
            <StyledButton title="Borrow" variant="success" onPress={borrow} style={{ flex: 1 }} />
            <StyledButton title="Return" variant="danger" onPress={returnBook} style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: palette.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  scannerWrap: {
    height: 220,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.chestnut,
    ...shadows.md,
  },
  scanOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.sm,
  },
  scanLabel: {
    ...fonts.sm,
    ...fonts.semibold,
    color: palette.white,
    textAlign: 'center',
  },
  scanButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray700,
    marginBottom: spacing.md,
  },
  formGap: { gap: spacing.md },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
