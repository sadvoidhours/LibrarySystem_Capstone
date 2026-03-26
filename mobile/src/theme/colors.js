import { DefaultTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

/* ───────── colour palette (light) ───────── */
export const palette = {
  /* primary greens */
  green:        '#2E7D32',
  greenDark:    '#1B5E20',
  greenLight:   '#E8F5E9',
  greenMint:    '#A5D6A7',
  greenPastel:  '#C8E6C9',

  /* brand aliases → green-based */
  chestnut:     '#2E7D32',
  chestnutDark: '#1B5E20',
  chestnutLight:'#43A047',
  yellow:       '#66BB6A',
  yellowSoft:   '#E8F5E9',
  olive:        '#388E3C',
  oliveLight:   '#81C784',

  /* neutrals */
  white:        '#FFFFFF',
  background:   '#F9FBF9',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F1F8F2',
  gray50:       '#FAFAFA',
  gray100:      '#F0F4F0',
  gray200:      '#E0E6E0',
  gray300:      '#C4CCC4',
  gray400:      '#9CA89C',
  gray500:      '#6B7A6B',
  gray600:      '#4A574A',
  gray700:      '#333D33',
  gray800:      '#1C231C',

  /* pastel accents */
  red:          '#EF5350',
  redLight:     '#FFEBEE',
  blue:         '#42A5F5',
  blueLight:    '#E3F2FD',
  orange:       '#FFA726',
  orangeLight:  '#FFF3E0',
  teal:         '#26A69A',
  tealLight:    '#E0F2F1',
  purple:       '#AB47BC',
  purpleLight:  '#F3E5F5',
};

/* ───────── colour palette (dark) ───────── */
const darkPalette = {
  green:        '#81C784',
  greenDark:    '#66BB6A',
  greenLight:   '#1A2E1D',
  greenMint:    '#A5D6A7',
  greenPastel:  '#243D28',

  chestnut:     '#81C784',
  chestnutDark: '#66BB6A',
  chestnutLight:'#A5D6A7',
  yellow:       '#A5D6A7',
  yellowSoft:   '#1A2E1D',
  olive:        '#A5D6A7',
  oliveLight:   '#2E4A33',

  white:        '#FFFFFF',
  background:   '#111A13',
  surface:      '#182019',
  surfaceAlt:   '#1E281F',
  gray50:       '#182019',
  gray100:      '#1E281F',
  gray200:      '#2A3A2D',
  gray300:      '#3F5242',
  gray400:      '#6E8372',
  gray500:      '#98AC9C',
  gray600:      '#B8CAB9',
  gray700:      '#D6E2D8',
  gray800:      '#ECF1ED',

  red:          '#FF8A80',
  redLight:     '#3A1C1E',
  blue:         '#90CAF9',
  blueLight:    '#1A2A3D',
  orange:       '#FFB74D',
  orangeLight:  '#3A2810',
  teal:         '#80CBC4',
  tealLight:    '#16352F',
  purple:       '#CE93D8',
  purpleLight:  '#2E1D33',
};

export const getThemePalette = (mode = 'light') => (mode === 'dark' ? darkPalette : palette);

/* ───────── navigation theme ───────── */
export const createAppTheme = (mode = 'light') => {
  const p = getThemePalette(mode);
  return {
    ...DefaultTheme,
    dark: mode === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary:      p.green,
      background:   p.background,
      card:         p.surface,
      text:         p.gray800,
      border:       p.gray200,
      notification: p.green,
    },
  };
};

export const appTheme = createAppTheme('light');

/* ───────── shadows ───────── */
export const shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
    android: { elevation: 2 },
    web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6 },
    android: { elevation: 4 },
    web: { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12 },
    android: { elevation: 8 },
    web: { boxShadow: '0 4px 16px rgba(0,0,0,0.14)' },
    default: {},
  }),
};

/* ───────── typography ───────── */
export const fontFamily = Platform.select({
  web: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fonts = {
  xs:   { fontSize: 11, lineHeight: 16, fontFamily },
  sm:   { fontSize: 13, lineHeight: 18, fontFamily },
  base: { fontSize: 15, lineHeight: 22, fontFamily },
  md:   { fontSize: 17, lineHeight: 24, fontFamily },
  lg:   { fontSize: 20, lineHeight: 28, fontFamily },
  xl:   { fontSize: 24, lineHeight: 32, fontFamily },
  xxl:  { fontSize: 30, lineHeight: 38, fontFamily },
  bold:      { fontWeight: '700' },
  semibold:  { fontWeight: '600' },
  medium:    { fontWeight: '500' },
};

/* ───────── spacing ───────── */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/* ───────── radii ───────── */
export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

/* ───────── shared base styles ───────── */
export const createBaseStyles = (p) => ({
  screenContainer: {
    flex: 1,
    backgroundColor: p.background,
    padding: spacing.lg,
  },
  webCenter: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
});

/* backwards-compat default export (light) */
export const baseStyles = createBaseStyles(palette);
