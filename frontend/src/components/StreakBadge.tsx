import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface StreakBadgeProps {
  streak: number;
  freezesAvailable: number;
  onPurchaseFreeze?: () => void;
}

/**
 * Daily streak display with fire icons.
 * Includes a "Streak Freeze" purchase button to prevent
 * loss-aversion burnout.
 */
export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak,
  freezesAvailable,
  onPurchaseFreeze,
}) => {
  const fireIcons = streak > 0 ? '🔥'.repeat(Math.min(streak, 7)) : '❄️';

  return (
    <View style={styles.container}>
      <View style={styles.streakRow}>
        <Text style={styles.fireIcons}>{fireIcons}</Text>
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
      </View>

      {freezesAvailable > 0 && (
        <View style={styles.freezeRow}>
          <Text style={styles.freezeIcon}>🛡️</Text>
          <Text style={styles.freezeText}>
            {freezesAvailable} Streak Freeze{freezesAvailable !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {onPurchaseFreeze && (
        <TouchableOpacity style={styles.buyButton} onPress={onPurchaseFreeze}>
          <Text style={styles.buyButtonText}>Buy Streak Freeze (100 XP)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIcons: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    ...FONTS.heading,
    color: COLORS.streak,
  },
  streakLabel: {
    ...FONTS.caption,
  },
  freezeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  freezeIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  freezeText: {
    ...FONTS.bodySmall,
  },
  buyButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  buyButtonText: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
});
