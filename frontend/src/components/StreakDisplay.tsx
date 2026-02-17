import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakDisplayProps {
  streak: number;
  streakFreezes: number;
}

export function StreakDisplay({ streak, streakFreezes }: StreakDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.fire}>🔥</Text>
      <Text style={styles.streak}>{streak}</Text>
      <Text style={styles.label}>day streak</Text>
      {streakFreezes > 0 && (
        <View style={styles.freezeBadge}>
          <Text style={styles.freezeText}>❄️ {streakFreezes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  fire: {
    fontSize: 20,
  },
  streak: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
  },
  label: {
    fontSize: 12,
    color: '#bf360c',
  },
  freezeBadge: {
    marginLeft: 8,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freezeText: {
    fontSize: 12,
    color: '#1565c0',
  },
});
