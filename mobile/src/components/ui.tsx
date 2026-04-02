import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../utils/theme';

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}
export const Card = ({ children, style }: CardProps) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
}
export const Button = ({ title, onPress, variant = 'primary', loading, disabled, style, textStyle, small }: ButtonProps) => {
  const bg: Record<string, string> = {
    primary: Colors.primary,
    secondary: Colors.secondary,
    danger: Colors.danger,
    outline: 'transparent',
  };
  const border: Record<string, string> = { outline: Colors.primary };
  const textColor: Record<string, string> = { outline: Colors.primary };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bg[variant] },
        border[variant] ? { borderWidth: 1.5, borderColor: border[variant] } : {},
        small && styles.buttonSmall,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant] || '#fff'} size="small" />
      ) : (
        <Text style={[styles.buttonText, { color: textColor[variant] || '#fff' }, small && styles.buttonTextSmall, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}
export const Badge = ({ label, color = Colors.primary, textColor = '#fff' }: BadgeProps) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
  </View>
);

// ── ProgressBar ───────────────────────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  style?: ViewStyle;
  height?: number;
}
export const ProgressBar = ({ progress, color = Colors.primary, style, height = 10 }: ProgressBarProps) => {
  const validProgress = isNaN(progress) ? 0 : progress;
  const clamped = Math.max(0, Math.min(1, validProgress));
  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View style={[styles.progressFill, { width: `${clamped * 100}%` as any, backgroundColor: color, height }]} />
    </View>
  );
};

// ── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}
export const SectionHeader = ({ title, action }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={styles.sectionAction}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
}
export const EmptyState = ({ emoji, title, subtitle }: EmptyStateProps) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyEmoji}>{emoji}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonTextSmall: { fontSize: 13 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  progressTrack: {
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { borderRadius: BorderRadius.full },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: { ...Typography.h3 },
  sectionAction: { ...Typography.bodyBold, color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { ...Typography.h3, textAlign: 'center', marginBottom: 4 },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
