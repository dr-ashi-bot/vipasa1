import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import type { Quest } from '../types';

interface QuestCardProps {
  quests: Quest[];
}

export const QuestCard: React.FC<QuestCardProps> = ({ quests }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Quests</Text>
      {quests.map((quest) => {
        const progressPercent =
          quest.target > 0 ? (quest.progress / quest.target) * 100 : 0;
        const isComplete = quest.progress >= quest.target;

        return (
          <View key={quest.quest_id} style={styles.questRow}>
            <View style={styles.questHeader}>
              <Text style={styles.questIcon}>
                {quest.type === 'monthly' ? '🏆' : '⚡'}
              </Text>
              <View style={styles.questInfo}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                {quest.description && (
                  <Text style={styles.questDesc}>{quest.description}</Text>
                )}
              </View>
              {isComplete && <Text style={styles.checkmark}>✅</Text>}
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progressPercent, 100)}%`,
                    backgroundColor: isComplete
                      ? COLORS.success
                      : COLORS.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {quest.progress}/{quest.target}
            </Text>
          </View>
        );
      })}
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
  title: {
    ...FONTS.subheading,
    marginBottom: SPACING.md,
  },
  questRow: {
    marginBottom: SPACING.md,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  questIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    ...FONTS.body,
    fontWeight: '600',
  },
  questDesc: {
    ...FONTS.caption,
  },
  checkmark: {
    fontSize: 18,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
  },
  progressText: {
    ...FONTS.caption,
    textAlign: 'right',
  },
});
