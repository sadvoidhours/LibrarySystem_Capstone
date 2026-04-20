import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Centralized icon component backed by MaterialCommunityIcons.
 *
 * Usage:
 *   <Icon name="book" size={20} color="#333" />
 *
 * Every semantic name maps to a MaterialCommunityIcons glyph so the
 * entire app can switch icon sets by editing only this file.
 */

const ICON_MAP = {
  /* ── navigation / chrome ── */
  'menu':                'menu',
  'close':               'close',
  'arrow-back':          'arrow-left',
  'chevron-down':        'chevron-down',
  'radio-button-on':     'radiobox-marked',
  'refresh':             'refresh',

  /* ── library / books ── */
  'book':                'book-outline',
  'library':             'library-outline',
  'catalog':             'bookshelf',

  /* ── people / accounts ── */
  'person':              'account-outline',
  'person-circle':       'account-circle-outline',
  'people':              'account-group-outline',
  'person-add':          'account-plus-outline',
  'school':              'school-outline',
  'id-card':             'card-account-details-outline',

  /* ── status / feedback ── */
  'checkmark-circle':    'check-circle-outline',
  'checkmark-done-circle': 'check-all',
  'alert-circle':        'alert-circle-outline',
  'close-circle':        'close-circle-outline',
  'time':                'clock-outline',
  'hourglass':           'timer-sand',
  'arrow-undo-circle':   'undo-variant',

  /* ── actions ── */
  'scan':                'barcode-scan',
  'qr-code':             'qrcode',
  'search':              'magnify',
  'swap-horizontal':     'swap-horizontal',
  'cloud-upload':        'cloud-upload-outline',
  'image':               'image-outline',
  'camera':              'camera-outline',

  /* ── data / charts ── */
  'stats-chart':         'chart-bar',
  'cash':                'cash',
  'calendar':            'calendar-outline',
  'document-text':       'file-document-outline',
  'briefcase':           'briefcase-outline',
  'shield-checkmark':    'shield-check-outline',

  /* ── notification / comms ── */
  'notifications':       'bell-outline',
  'notifications-off':   'bell-off-outline',

  /* ── misc ── */
  'map':                 'map-marker-outline',
  'phone-portrait':      'cellphone',
  'sunny':               'white-balance-sunny',
  'moon':                'moon-waning-crescent',
  'settings':            'cog-outline',
  'home':                'home-outline',
  'speedometer':         'speedometer',
  'file-tray':           'tray-arrow-down',
  'log-out':             'logout',

  /* ── keep existing MaterialCommunityIcons names as pass-through ── */
};

export default function Icon({ name, size = 20, color = '#000', style }) {
  // Strip the -outline suffix if present – the map uses short semantic keys
  const stripped = name?.replace(/-outline$/, '') ?? 'help-circle';
  const resolved = ICON_MAP[stripped] || ICON_MAP[name] || name;

  return (
    <MaterialCommunityIcons name={resolved} size={size} color={color} style={style} />
  );
}
