export const COLORS = {
  // Primary palette
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4A3CB5',
  
  // Accent
  accent: '#00CEC9',
  accentLight: '#55EFC4',
  accentDark: '#00A89D',
  
  // Backgrounds
  background: '#0A0A0F',
  surface: '#13131A',
  surfaceLight: '#1C1C27',
  surfaceElevated: '#252535',
  
  // Cards
  card: '#16161F',
  cardHover: '#1E1E2A',
  cardBorder: '#2A2A3A',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',
  textPlaceholder: '#4A4A5E',
  
  // Status
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#FF6B6B',
  info: '#74B9FF',
  
  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#6C5CE7', '#A29BFE'],
  gradientAccent: ['#00CEC9', '#55EFC4'],
  gradientDark: ['#0A0A0F', '#13131A'],
  gradientCard: ['#16161F', '#1E1E2A'],
  gradientHero: ['#6C5CE7', '#00CEC9'],
  gradientSunset: ['#E17055', '#FDCB6E'],
  gradientRose: ['#FD79A8', '#A29BFE'],
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  divider: '#2A2A3A',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 34,
  display: 42,
};

export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
};
