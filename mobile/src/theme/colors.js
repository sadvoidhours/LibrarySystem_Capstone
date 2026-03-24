import { DefaultTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

/* ───────── colour palette ───────── */
export const palette = {
  /* primary greens */
  green:        '#2E7D32',
  greenDark:    '#1B5E20',
  greenLight:   '#E8F5E9',
  greenMint:    '#A5D6A7',
  greenPastel:  '#C8E6C9',

  /* brand aliases → now green-based so the whole app recolours */
  chestnut:     '#2E7D32',
  chestnutDark: '#1B5E20',
  chestnutLight:'#43A047',
  yellow:       '#66BB6A',
  yellowSoft:   '#E8F5E9',
  olive:        '#388E3C',
  oliveLight:   '#81C784',

  /* neutrals – clean & modern */
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

const darkPalette = {
  green:        '#66BB6A',
  greenDark:    '#43A047',
  greenLight:   '#17331B',
  greenMint:    '#81C784',
  greenPastel:  '#204626',

  chestnut:     '#66BB6A',
  chestnutDark: '#43A047',
  chestnutLight:'#81C784',
  yellow:       '#81C784',
  yellowSoft:   '#17331B',
  olive:        '#81C784',
  oliveLight:   '#204626',

  white:        '#101610',
  background:   '#0D120E',
  surface:      '#141B15',
  surfaceAlt:   '#1A241C',
  gray50:       '#141B15',
  gray100:      '#1A241C',
  gray200:      '#253128',
  gray300:      '#3A473D',
  gray400:      '#6E7D72',
  gray500:      '#95A196',
  gray600:      '#B6C0B8',
  gray700:      '#D3DBD5',
  gray800:      '#F4F7F5',

  red:          '#FF8A80',
  redLight:     '#351719',
  blue:         '#90CAF9',
  blueLight:    '#15263A',
  orange:       '#FFB74D',
  orangeLight:  '#33210F',
  teal:         '#80CBC4',
  tealLight:    '#12312D',
  purple:       '#CE93D8',
  purpleLight:  '#2A1B30',
};

export const getThemePalette = (mode = 'light') => (mode === 'dark' ? darkPalette : palette);

/* ───────── navigation theme ───────── */
export const createAppTheme = (mode = 'light') => {
  const activePalette = getThemePalette(mode);

  return {
    ...DefaultTheme,
    dark: mode === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary:      activePalette.green,
      background:   activePalette.background,
      card:         activePalette.surface,
      text:         activePalette.gray800,
      border:       activePalette.gray200,
      notification: activePalette.green,
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
export const fonts = {
  xs:   { fontSize: 11, lineHeight: 16 },
  sm:   { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  md:   { fontSize: 17, lineHeight: 24 },
  lg:   { fontSize: 20, lineHeight: 28 },
  xl:   { fontSize: 24, lineHeight: 32 },
  xxl:  { fontSize: 30, lineHeight: 38 },
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
export const baseStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: palette.background,
    padding: spacing.lg,
  },
  webCenter: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
};
