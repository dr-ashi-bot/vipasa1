import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface XpDisplayProps {
  totalXp: number;
  xpEarned?: number;
  showAnimation?: boolean;
}

export const XpDisplay: React.FC<XpDisplayProps> = ({
  totalXp,
  xpEarned,
  showAnimation,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.xpIcon}>⭐</Text>
      <Text style={styles.xpAmount}>{totalXp} XP</Text>
      {xpEarned !== undefined && xpEarned > 0 && showAnimation && (
        <View style={styles.earnedBadge}>
          <Text style={styles.earnedText}>+{xpEarned}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.small,
  },
  xpIcon: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  xpAmount: {
    ...FONTS.subheading,
    color: COLORS.xp,
  },
  earnedBadge: {
    marginLeft: SPACING.xs,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  earnedText: {
    ...FONTS.caption,
    color: COLORS.textOnPrimary,
    fontWeight: '700',
  },
});
