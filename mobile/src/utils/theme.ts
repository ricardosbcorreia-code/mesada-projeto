// Design tokens for Tarefa & Mesada
// Consistent colors, typography, and spacing used across all screens

export const Colors = {
  primary: '#4A90E2',       // Blue – parent accent
  primaryDark: '#2C6DB5',
  secondary: '#FF9500',     // Orange – child / gamified accent
  secondaryDark: '#CC7700',
  success: '#27AE60',
  danger: '#E53935',
  warning: '#F39C12',
  background: '#F4F6FA',
  card: '#FFFFFF',
  border: '#E8ECF4',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  // Gamification
  xpGold: '#F6C90E',
  xpPurple: '#9B59B6',
  taskMandatory: '#E53935',
  taskBonus: '#27AE60',
  taskPenalty: '#FF9500',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '700' as const, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  captionBold: { fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary },
};
