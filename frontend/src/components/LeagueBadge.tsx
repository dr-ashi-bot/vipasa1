import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LEAGUE_COLORS: Record<string, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Sapphire: '#0f52ba',
  Ruby: '#e0115f',
  Emerald: '#50c878',
  Amethyst: '#9966cc',
  Pearl: '#eae0c8',
  Obsidian: '#0b0b0b',
  Diamond: '#b9f2ff',
};

interface LeagueBadgeProps {
  league: string;
  weeklyXp?: number;
}

export function LeagueBadge({ league, weeklyXp }: LeagueBadgeProps) {
  const color = LEAGUE_COLORS[league] ?? '#888';
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.league, { color }]}>{league}</Text>
      {weeklyXp !== undefined && (
        <Text style={styles.xp}>{weeklyXp} XP</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  league: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  xp: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});
