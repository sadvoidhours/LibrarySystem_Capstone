import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FALLBACK_ICON = 'help-circle-outline';

const ICON_MAP = {
  menu: 'menu',
  close: 'close',
  'arrow-back': 'arrow-left',
  'chevron-down': 'chevron-down',
  'radio-button-on': 'radiobox-marked',
  refresh: 'refresh',
  book: 'book-outline',
  library: 'library-outline',
  catalog: 'bookshelf',
  person: 'account-outline',
  'person-circle': 'account-circle-outline',
  people: 'account-group-outline',
  'person-add': 'account-plus-outline',
  school: 'school-outline',
  'id-card': 'card-account-details-outline',
  'checkmark-circle': 'check-circle-outline',
  'checkmark-done-circle': 'check-all',
  'alert-circle': 'alert-circle-outline',
  'close-circle': 'close-circle-outline',
  time: 'clock-outline',
  hourglass: 'timer-sand',
  'arrow-undo-circle': 'undo-variant',
  scan: 'barcode-scan',
  'qr-code': 'qrcode',
  search: 'magnify',
  'swap-horizontal': 'swap-horizontal',
  'cloud-upload': 'cloud-upload-outline',
  image: 'image-outline',
  camera: 'camera-outline',
  'stats-chart': 'chart-bar',
  cash: 'cash',
  calendar: 'calendar-outline',
  'document-text': 'file-document-outline',
  briefcase: 'briefcase-outline',
  'shield-checkmark': 'shield-check-outline',
  notifications: 'bell-outline',
  'notifications-off': 'bell-off-outline',
  map: 'map-marker-outline',
  'phone-portrait': 'cellphone',
  sunny: 'white-balance-sunny',
  moon: 'moon-waning-crescent',
  settings: 'cog-outline',
  home: 'home-outline',
  speedometer: 'speedometer',
  'file-tray': 'tray-arrow-down',
  'log-out': 'logout',
};

const SUPPORTED_ICON_NAMES = new Set([
  FALLBACK_ICON,
  'menu',
  'close',
  'arrow-left',
  'chevron-down',
  'radiobox-marked',
  'refresh',
  'book-outline',
  'library-outline',
  'bookshelf',
  'account-outline',
  'account-circle-outline',
  'account-group-outline',
  'account-plus-outline',
  'school-outline',
  'card-account-details-outline',
  'check-circle-outline',
  'check-all',
  'alert-circle-outline',
  'close-circle-outline',
  'clock-outline',
  'timer-sand',
  'undo-variant',
  'barcode-scan',
  'qrcode',
  'magnify',
  'swap-horizontal',
  'cloud-upload-outline',
  'image-outline',
  'camera-outline',
  'chart-bar',
  'cash',
  'calendar-outline',
  'file-document-outline',
  'briefcase-outline',
  'shield-check-outline',
  'bell-outline',
  'bell-off-outline',
  'map-marker-outline',
  'cellphone',
  'white-balance-sunny',
  'moon-waning-crescent',
  'cog-outline',
  'home-outline',
  'speedometer',
  'tray-arrow-down',
  'logout',
]);

function normalizeIconName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/-outline$/, '');
}

function resolveIconName(name) {
  const normalized = normalizeIconName(name);
  const resolved = ICON_MAP[normalized] || String(name || '').trim();
  return SUPPORTED_ICON_NAMES.has(resolved) ? resolved : FALLBACK_ICON;
}

export default function Icon({ name, size = 20, color = '#000', style }) {
  const resolved = resolveIconName(name);

  return (
    <MaterialCommunityIcons name={resolved} size={size} color={color} style={style} />
  );
}
