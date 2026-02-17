import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Quest {
  title: string;
  target: number;
  current: number;
  completed: boolean;
}

interface QuestPanelProps {
  dailyQuests: Record<string, Quest>;
  monthlyQuest?: Quest;
}

/**
 * Quest Panel Component
 * Epic 3 (AC 3.4): Time-bound challenges and monthly quests.
 */
const QuestPanel: React.FC<QuestPanelProps> = ({
  dailyQuests,
  monthlyQuest,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {'\u2694\uFE0F'} Daily Quests
      </Text>

      {Object.entries(dailyQuests).map(([key, quest]) => (
        <View key={key} style={styles.questRow}>
          <Text style={styles.questIcon}>
            {quest.completed ? '\u2705' : '\u2B55'}
          </Text>
          <View style={styles.questInfo}>
            <Text
              style={[
                styles.questTitle,
                quest.completed && styles.completedTitle,
              ]}
            >
              {quest.title ?? key.replace(/_/g, ' ')}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (quest.current / quest.target) * 100,
                    )}%`,
                  },
                  quest.completed && styles.completedFill,
                ]}
              />
            </View>
          </View>
          <Text style={styles.progressText}>
            {quest.current}/{quest.target}
          </Text>
        </View>
      ))}

      {monthlyQuest && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>
            {'\uD83C\uDF1F'} {monthlyQuest.title}
          </Text>
          <View style={styles.monthlyBar}>
            <View
              style={[
                styles.monthlyFill,
                {
                  width: `${Math.min(
                    100,
                    (monthlyQuest.current / monthlyQuest.target) * 100,
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.monthlyText}>
            {monthlyQuest.current}/{monthlyQuest.target} problems solved
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3E5F5',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A148C',
    marginBottom: 12,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  questIcon: {
    fontSize: 20,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E1BEE7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 3,
  },
  completedFill: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 30,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#CE93D8',
    marginVertical: 12,
  },
  monthlyBar: {
    height: 10,
    backgroundColor: '#E1BEE7',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  monthlyFill: {
    height: '100%',
    backgroundColor: '#FF6F00',
    borderRadius: 5,
  },
  monthlyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default QuestPanel;
