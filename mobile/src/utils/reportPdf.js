import { Linking, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getThemePalette } from '../theme/colors';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildMetricCard = (metric) => `
  <div class="metric">
    <div class="metric-value">${escapeHtml(metric.value)}</div>
    <div class="metric-label">${escapeHtml(metric.label)}</div>
  </div>
`;

const buildTableRow = (columns) => `
  <tr>
    ${columns.map((column) => `<td>${escapeHtml(column)}</td>`).join('')}
  </tr>
`;

export const buildReportHtml = ({ title, subtitle, metrics = [], payments = [], borrowings = [], overdueItems = [] }, palette = getThemePalette('light')) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: Arial, sans-serif; color: ${palette.gray800}; padding: 28px; background: ${palette.background}; }
        .sheet { border: 1px solid ${palette.gray200}; border-radius: 18px; padding: 24px; background: ${palette.surface}; }
        h1 { margin: 0 0 8px; font-size: 26px; color: ${palette.green}; }
        .subtitle { margin: 0 0 20px; color: ${palette.gray500}; }
        .metrics { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
        .metric { flex: 1 1 140px; border: 1px solid ${palette.gray100}; border-radius: 14px; padding: 14px; background: ${palette.surfaceAlt}; }
        .metric-value { font-size: 24px; font-weight: 700; color: ${palette.gray800}; }
        .metric-label { font-size: 12px; font-weight: 700; color: ${palette.gray500}; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 4px; }
        .section { margin-top: 22px; }
        .section h2 { margin: 0 0 10px; font-size: 18px; color: ${palette.gray800}; }
        table { width: 100%; border-collapse: collapse; }
        td, th { text-align: left; padding: 10px 8px; border-bottom: 1px solid ${palette.gray100}; vertical-align: top; font-size: 12px; }
        th { color: ${palette.gray500}; text-transform: uppercase; letter-spacing: 0.6px; font-size: 11px; }
        .footer { margin-top: 18px; color: ${palette.gray500}; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>

        <div class="metrics">
          ${metrics.map(buildMetricCard).join('')}
        </div>

        <div class="section">
          <h2>Recent Payments</h2>
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th>Book</th>
                <th>Borrower</th>
              </tr>
            </thead>
            <tbody>
              ${payments.length ? payments.slice(0, 10).map((item) => buildTableRow([
                `₱${Number(item.amount || 0).toFixed(2)}`,
                item.payment_method || 'N/A',
                item.borrowingId?.bookId?.title || 'N/A',
                item.borrowingId?.userId?.name || 'N/A',
              ])).join('') : '<tr><td colspan="4">No payments recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Borrowing Activity</h2>
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>User</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              ${borrowings.length ? borrowings.slice(0, 10).map((item) => buildTableRow([
                item.bookId?.title || 'N/A',
                item.userId?.name || 'N/A',
                item.status || 'N/A',
                item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A',
              ])).join('') : '<tr><td colspan="4">No borrowing data available.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Overdue Items</h2>
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>User</th>
                <th>Penalty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${overdueItems.length ? overdueItems.slice(0, 10).map((item) => buildTableRow([
                item.bookId?.title || 'N/A',
                item.userId?.name || 'N/A',
                `₱${Number(item.penaltyAmount || 0).toFixed(2)}`,
                item.status || 'N/A',
              ])).join('') : '<tr><td colspan="4">No overdue items recorded.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">This report was generated electronically by the library system.</div>
      </div>
    </body>
  </html>
`;

export const exportReportPdf = async (reportData, options = {}) => {
  const html = buildReportHtml(reportData, options.palette || getThemePalette(options.themeMode || 'light'));
  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === 'web') {
    window.open(uri, '_blank');
    return uri;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share report PDF' });
    return uri;
  }

  await Linking.openURL(uri);
  return uri;
};
