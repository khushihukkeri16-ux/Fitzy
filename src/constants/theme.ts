/**
 * FITZY design system — warm, editorial, premium.
 */
import { Platform } from 'react-native';

export const palette = {
  // Canvas
  bg: '#FAF5EE',
  surface: '#FFFFFF',
  surfaceSoft: '#FFFBF5',

  // Ink
  ink: '#1D1A16',
  inkSoft: '#6F6759',
  inkFaint: '#A79D8D',

  // Accents
  blush: '#F4DAD3',
  blushDeep: '#DFA69B',
  cream: '#F3EADA',
  lavender: '#E3DCF2',
  lavenderDeep: '#A99BC9',
  sage: '#DCE4D7',
  gold: '#C9A468',

  // Feedback
  danger: '#C4574A',
  success: '#5E7D5A',

  // Lines
  hairline: 'rgba(29, 26, 22, 0.08)',
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 34,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 34,
  xxl: 48,
} as const;

export const fonts = {
  /** Editorial display serif */
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayBlack: 'Fraunces_900Black',
  /** Friendly modern sans */
  body: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtra: 'Manrope_800ExtraBold',
} as const;

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 10px 30px rgba(29,26,22,0.07)' } as object,
    default: {
      shadowColor: '#1D1A16',
      shadowOpacity: 0.07,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
  }) as object,
  floating: Platform.select({
    web: { boxShadow: '0 16px 40px rgba(29,26,22,0.16)' } as object,
    default: {
      shadowColor: '#1D1A16',
      shadowOpacity: 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 9,
    },
  }) as object,
} as const;
