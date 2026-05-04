import { Linking, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getThemePalette } from '../theme/colors';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildRow = (label, value) => `
  <tr>
    <td class="label">${escapeHtml(label)}</td>
    <td class="value">${escapeHtml(value)}</td>
  </tr>
`;

export const buildReceiptHtml = ({
  paymentId,
  paymentDate,
  amount,
  paymentMethod,
  bookTitle,
  bookAuthor,
  borrowerName,
  dueDate,
  borrowDate,
}, palette = getThemePalette('light')) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; color: ${palette.gray800}; background: ${palette.background}; }
        .card { border: 1px solid ${palette.gray200}; border-radius: 16px; padding: 24px; background: ${palette.surface}; }
        h1 { margin: 0 0 8px; font-size: 24px; color: ${palette.green}; }
        .subtitle { margin: 0 0 20px; color: ${palette.gray500}; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 10px 0; border-bottom: 1px solid ${palette.gray100}; vertical-align: top; }
        .label { width: 38%; color: ${palette.gray500}; font-weight: 700; }
        .value { font-weight: 400; }
        .footer { margin-top: 20px; color: ${palette.gray500}; font-size: 12px; }
        .total { margin-top: 16px; padding: 14px; border-radius: 12px; background: ${palette.greenLight}; font-size: 18px; font-weight: 700; color: ${palette.greenDark}; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Payment Receipt</h1>
        <p class="subtitle">Pateros Technological College Library</p>
        <table>
          ${buildRow('Receipt ID', paymentId || 'N/A')}
          ${buildRow('Borrower', borrowerName || 'N/A')}
          ${buildRow('Book', bookTitle || 'N/A')}
          ${buildRow('Author', bookAuthor || 'N/A')}
          ${buildRow('Borrowed', formatDate(borrowDate))}
          ${buildRow('Due Date', formatDate(dueDate))}
          ${buildRow('Payment Date', formatDate(paymentDate))}
          ${buildRow('Payment Method', paymentMethod || 'N/A')}
        </table>
        <div class="total">Amount Paid: ₱${Number(amount || 0).toFixed(2)}</div>
        <div class="footer">This receipt was generated electronically and is valid without a signature.</div>
      </div>
    </body>
  </html>
`;

export const exportReceiptPdf = async (receiptData, options = {}) => {
  const html = buildReceiptHtml(receiptData, options.palette || getThemePalette(options.themeMode || 'light'));
  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === 'web') {
    window.open(uri, '_blank');
    return uri;
  }

  const shareOptions = { mimeType: 'application/pdf', dialogTitle: 'Share receipt PDF' };
  if (Platform.OS === 'ios') {
    shareOptions.UTI = 'com.adobe.pdf';
  }

  if (await Sharing.isAvailableAsync()) {
    try {
      await Sharing.shareAsync(uri, shareOptions);
      return uri;
    } catch (error) {
      await Print.printAsync({ html });
      return uri;
    }
  }

  await Print.printAsync({ html });
  return uri;
};