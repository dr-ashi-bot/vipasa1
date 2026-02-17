import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface XPDisplayProps {
  totalXP: number;
  weeklyXP: number;
  league: string;
}

const XPDisplay: React.FC<XPDisplayProps> = ({
  totalXP,
  weeklyXP,
  league,
}) => {
  const getLeagueColor = (league: string): string => {
    const colors: Record<string, string> = {
      Bronze: '#CD7F32',
      Silver: '#C0C0C0',
      Gold: '#FFD700',
      Sapphire: '#0F52BA',
      Ruby: '#E0115F',
      Emerald: '#50C878',
      Amethyst: '#9966CC',
      Pearl: '#F0EAD6',
      Obsidian: '#1C1C1C',
      Diamond: '#B9F2FF',
    };
    return colors[league] || '#999';
  };

  return (
    <View style={styles.container}>
      <View style={styles.xpContainer}>
        <Text style={styles.xpLabel}>Total XP</Text>
        <Text style={styles.xpValue}>{totalXP.toLocaleString()}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.xpContainer}>
        <Text style={styles.xpLabel}>This Week</Text>
        <Text style={styles.weeklyXP}>{weeklyXP.toLocaleString()}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View
        style={[
          styles.leagueContainer,
          { backgroundColor: getLeagueColor(league) + '20' },
        ]}
      >
        <Text style={styles.leagueEmoji}>🏆</Text>
        <Text
          style={[
            styles.leagueName,
            { color: getLeagueColor(league) },
          ]}
        >
          {league}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  xpContainer: {
    flex: 1,
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  xpValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  weeklyXP: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  leagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leagueEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default XPDisplay;
