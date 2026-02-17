import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StreakDisplayProps {
  streak: number;
  freezes: number;
  onUseFreeze?: () => void;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  freezes,
  onUseFreeze,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.streakContainer}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <View>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
      </View>
      
      {freezes > 0 && (
        <TouchableOpacity
          style={styles.freezeButton}
          onPress={onUseFreeze}
        >
          <Text style={styles.freezeEmoji}>❄️</Text>
          <Text style={styles.freezeCount}>{freezes}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fireEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
  },
  freezeButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  freezeEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  freezeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
});

export default StreakDisplay;
