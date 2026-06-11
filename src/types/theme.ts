export const lightColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F0F0',
  text: '#1A1A1A',
  textSecondary: '#999999',
  textTertiary: '#BBBBBB',
  primary: '#1A73E8',
  primaryLight: '#E8F0FE',
  destructive: '#F44336',
  destructiveLight: '#FFEBEE',
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  separator: '#EEEEEE',
  fill: '#F0F0F0',
  tabActive: '#1A73E8',
  tabInactive: '#999999',
  cardShadow: '#000000',
  gradientStart: '#1A73E8',
  gradientEnd: '#4FC3F7',
};

export const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceSecondary: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#666666',
  primary: '#4FC3F7',
  primaryLight: '#1A3A4A',
  destructive: '#FF6B6B',
  destructiveLight: '#3A1A1A',
  success: '#66BB6A',
  successLight: '#1A3A1A',
  warning: '#FFB74D',
  warningLight: '#3A2A1A',
  separator: '#333333',
  fill: '#2C2C2C',
  tabActive: '#4FC3F7',
  tabInactive: '#888888',
  cardShadow: '#000000',
  gradientStart: '#4FC3F7',
  gradientEnd: '#81D4FA',
};

export type ThemeColors = typeof lightColors;

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const },
  titleMedium: { fontSize: 20, fontWeight: '600' as const },
  titleSmall: { fontSize: 18, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '500' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};
