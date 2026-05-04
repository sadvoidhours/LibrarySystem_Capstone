import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSelector } from 'react-redux';
import api from '../api/client';
import { baseStyles, fonts, getThemePalette, radii, shadows, spacing } from '../theme/colors';
import BrandHeader from '../components/BrandHeader';
import Card from '../components/Card';
import StyledInput from '../components/StyledInput';
import StyledButton from '../components/StyledButton';

const TRANSACTION_MODES = [
  { key: 'borrow', label: 'Borrow', variant: 'success' },
  { key: 'return', label: 'Return', variant: 'danger' },
];

export default function ScannerScreen() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = useMemo(() => getThemePalette(themeMode), [themeMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [userBarcode, setUserBarcode] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [transactionMode, setTransactionMode] = useState('borrow');
  const [scanTarget, setScanTarget] = useState(null);
  const [dueDays, setDueDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to scan a user or book barcode.');
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);
  const webScannerRef = useRef(null);
  const webScannerId = 'web-barcode-scanner';

  const resetForm = () => {
    setUserBarcode('');
    setBookIsbn('');
    setDueDays('7');
    setScanTarget(null);
    scanLockRef.current = false;
    setStatusMessage('Ready to scan a user or book barcode.');
  };

  const submitTransaction = async () => {
    const trimmedUserBarcode = userBarcode.trim();
    const trimmedBookIsbn = bookIsbn.trim();

    if (!trimmedUserBarcode || !trimmedBookIsbn) {
      Alert.alert('Missing ISBN', 'Scan or enter both the user barcode and book ISBN first.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (transactionMode === 'borrow') {
        await api.post('/borrowings/scan/borrow', {
          userBarcode: trimmedUserBarcode,
          bookIsbn: trimmedBookIsbn,
          dueDays: Number(dueDays) || 7,
        });
        Alert.alert('Success', 'Borrow transaction completed.');
        setStatusMessage('Borrow transaction completed successfully.');
      } else {
        await api.post('/borrowings/scan/return', {
          userBarcode: trimmedUserBarcode,
          bookIsbn: trimmedBookIsbn,
        });
        Alert.alert('Success', 'Return transaction completed.');
        setStatusMessage('Return transaction completed successfully.');
      }

      resetForm();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Transaction failed');
      setStatusMessage(error.response?.data?.message || 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyScanValue = (target, value) => {
    if (!target) {
      return;
    }
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      setStatusMessage('No barcode detected.');
      return;
    }
    if (target === 'user') setUserBarcode(trimmed);
    if (target === 'book') setBookIsbn(trimmed);
    setStatusMessage(`${target === 'user' ? 'User' : 'Book ISBN'} captured.`);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    let cancelled = false;
    let localScanner = null;

    const stopScanner = async () => {
      try {
        if (localScanner) {
          await localScanner.stop();
          await localScanner.clear();
        }
      } catch (err) {
        // ignore cleanup errors
      } finally {
        localScanner = null;
        webScannerRef.current = null;
      }
    };

    const startScanner = async () => {
      if (!scanTarget) {
        await stopScanner();
        return;
      }

      if (typeof document === 'undefined') {
        setStatusMessage('Web scanner unavailable in this environment.');
        return;
      }

      const container = document.getElementById(webScannerId);
      if (!container) {
        setStatusMessage('Scanner view not ready yet.');
        return;
      }

      try {
        setStatusMessage('Starting web scanner...');
        const module = await import('html5-qrcode');
        if (cancelled) return;

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = module;
        localScanner = new Html5Qrcode(webScannerId);
        webScannerRef.current = localScanner;

        const formats = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        await localScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 }, formatsToSupport: formats },
          (decodedText) => {
            applyScanValue(scanTarget, decodedText);
            setScanTarget(null);
          },
          () => {}
        );

        if (!cancelled) {
          setStatusMessage(`Scanning ${scanTarget === 'book' ? 'book ISBN' : 'user barcode'}...`);
        }
      } catch (err) {
        console.error('web scanner error', err);
        setStatusMessage('Unable to start the web scanner.');
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopScanner().catch(() => null);
    };
  }, [scanTarget]);

  const enableScanner = async (target) => {
    if (Platform.OS === 'web') {
      setScanTarget(target);
      setStatusMessage(`Preparing ${target === 'book' ? 'book ISBN' : 'user barcode'} scanner...`);
      return;
    }

    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to scan barcodes.');
        return;
      }
    }
    scanLockRef.current = false;
    setStatusMessage(`Scanning ${target} ${target === 'book' ? 'ISBN' : 'barcode'}...`);
    setScanTarget(target);
  };

  const onScan = ({ data }) => {
    if (scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;
    applyScanValue(scanTarget, data);
    setScanTarget(null);

    setTimeout(() => {
      scanLockRef.current = false;
    }, 600);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, baseStyles.webCenter]}>
          <BrandHeader title="Scanner Circulation" subtitle="Scan user and book barcodes" />

          <Card style={styles.statusCard}>
            <Text style={[styles.statusTitle, { color: palette.gray800 }]}>Transaction mode</Text>
            <View style={styles.modeRow}>
              {TRANSACTION_MODES.map((mode) => (
                <StyledButton
                  key={mode.key}
                  title={mode.label}
                  variant={transactionMode === mode.key ? mode.variant : 'outline'}
                  small
                  onPress={() => setTransactionMode(mode.key)}
                  style={styles.modeButton}
                />
              ))}
            </View>
            <Text style={[styles.statusMessage, { color: palette.gray500 }]}>{statusMessage}</Text>
          </Card>

          {scanTarget && Platform.OS !== 'web' && (
            <View style={styles.scannerWrap}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
                }}
                onBarcodeScanned={onScan}
              />
              <View style={styles.scanOverlay}>
                <Text style={styles.scanLabel}>Scanning {scanTarget === 'book' ? 'book ISBN' : 'user barcode'}...</Text>
              </View>
            </View>
          )}
          {scanTarget && Platform.OS === 'web' && (
            <View style={styles.webScannerWrap}>
              <View nativeID={webScannerId} style={styles.webScannerViewport} />
              <View style={styles.scanOverlay}>
                <Text style={styles.scanLabel}>Scanning {scanTarget === 'book' ? 'book ISBN' : 'user barcode'}...</Text>
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
              title="Scan ISBN"
              variant="outline"
              small
              onPress={() => enableScanner('book')}
              style={{ flex: 1 }}
            />
          </View>

          <Card>
            <Text style={[styles.sectionTitle, { color: palette.gray700 }]}>Manual Entry</Text>
            <View style={styles.formGap}>
              <StyledInput label="User Barcode" placeholder="User barcode" value={userBarcode} onChangeText={setUserBarcode} />
              <StyledInput label="Book ISBN" placeholder="Book ISBN" value={bookIsbn} onChangeText={setBookIsbn} />
              {transactionMode === 'borrow' ? (
                <StyledInput
                  label="Due Days"
                  placeholder="7"
                  value={dueDays}
                  onChangeText={setDueDays}
                  keyboardType="numeric"
                />
              ) : null}
            </View>
          </Card>

          <View style={styles.actionRow}>
            <StyledButton title="Reset" variant="outline" onPress={resetForm} style={{ flex: 1 }} disabled={isSubmitting} />
            <StyledButton
              title={transactionMode === 'borrow' ? 'Complete Borrow' : 'Complete Return'}
              variant={transactionMode === 'borrow' ? 'success' : 'danger'}
              onPress={submitTransaction}
              style={{ flex: 1 }}
              loading={isSubmitting}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (p) => StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  statusCard: { gap: spacing.sm },
  statusTitle: {
    ...fonts.base,
    ...fonts.bold,
  },
  statusMessage: {
    ...fonts.sm,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
  },
  scannerWrap: {
    height: 220,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: p.chestnut,
    ...shadows.md,
  },
  webScannerWrap: {
    height: 260,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: p.chestnut,
    backgroundColor: '#000000',
    ...shadows.md,
  },
  webScannerViewport: {
    flex: 1,
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
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scanButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...fonts.base,
    ...fonts.bold,
    marginBottom: spacing.md,
  },
  formGap: { gap: spacing.md },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
