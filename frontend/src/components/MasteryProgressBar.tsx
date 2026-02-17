import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface MasteryProgressBarProps {
  conceptName: string;
  subject: 'math' | 'ela';
  mastery: number;
  previousMastery?: number;
}

export const MasteryProgressBar: React.FC<MasteryProgressBarProps> = ({
  conceptName,
  subject,
  mastery,
  previousMastery,
}) => {
  const color = subject === 'math' ? COLORS.primary : COLORS.secondary;
  const percentage = Math.round(mastery * 100);
  const improved =
    previousMastery !== undefined && mastery > previousMastery;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subjectBadge}>
          {subject === 'math' ? '🔢' : '📖'}{' '}
          {subject === 'math' ? 'Math' : 'ELA'}
        </Text>
        <Text style={styles.conceptName}>{conceptName}</Text>
        <Text style={[styles.percentage, { color }]}>
          {percentage}%
          {improved && ' ↑'}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  subjectBadge: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  conceptName: {
    ...FONTS.bodySmall,
    flex: 1,
  },
  percentage: {
    ...FONTS.bodySmall,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
  },
});
