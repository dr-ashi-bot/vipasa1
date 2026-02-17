import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak?: number;
  streakFreezes: number;
  onPurchaseFreeze?: () => void;
}

/**
 * Streak Display with fire icons and streak freeze purchase.
 * Epic 3 (AC 3.2): Daily streak tracking with loss-aversion prevention.
 */
const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  streakFreezes,
  onPurchaseFreeze,
}) => {
  const fireIcons = Array.from(
    { length: Math.min(currentStreak, 7) },
    (_, i) => i,
  );

  return (
    <View style={styles.container}>
      <View style={styles.streakRow}>
        <View style={styles.fireContainer}>
          {fireIcons.map((i) => (
            <Text key={i} style={styles.fireIcon}>
              {'\uD83D\uDD25'}
            </Text>
          ))}
          {currentStreak > 7 && (
            <Text style={styles.moreText}>+{currentStreak - 7}</Text>
          )}
        </View>
        <Text style={styles.streakCount}>{currentStreak} day streak!</Text>
      </View>

      {longestStreak !== undefined && longestStreak > currentStreak && (
        <Text style={styles.bestStreak}>
          Best: {longestStreak} days {'\uD83C\uDFC6'}
        </Text>
      )}

      <View style={styles.freezeRow}>
        <Text style={styles.freezeLabel}>
          {'\u2744\uFE0F'} Streak Freezes: {streakFreezes}
        </Text>
        {onPurchaseFreeze && (
          <TouchableOpacity
            style={styles.buyButton}
            onPress={onPurchaseFreeze}
          >
            <Text style={styles.buyButtonText}>Buy (200 XP)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIcon: {
    fontSize: 24,
    marginRight: -4,
  },
  moreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6F00',
    marginLeft: 4,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
  },
  bestStreak: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
  freezeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  freezeLabel: {
    fontSize: 14,
    color: '#555',
  },
  buyButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StreakDisplay;
