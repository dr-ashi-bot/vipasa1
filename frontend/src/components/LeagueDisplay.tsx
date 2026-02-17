import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { League, LeaderboardEntry } from '../types';

interface LeagueDisplayProps {
  league: League;
  entries: LeaderboardEntry[];
  userRank: number;
}

const LEAGUE_COLORS: Record<League, string> = {
  [League.BRONZE]: '#CD7F32',
  [League.SILVER]: '#C0C0C0',
  [League.GOLD]: '#FFD700',
  [League.SAPPHIRE]: '#0F52BA',
  [League.RUBY]: '#E0115F',
  [League.EMERALD]: '#50C878',
  [League.AMETHYST]: '#9966CC',
  [League.PEARL]: '#F5F5DC',
  [League.OBSIDIAN]: '#1C1C1C',
  [League.DIAMOND]: '#B9F2FF',
};

const LEAGUE_EMOJI: Record<League, string> = {
  [League.BRONZE]: '\uD83E\uDD49',
  [League.SILVER]: '\uD83E\uDD48',
  [League.GOLD]: '\uD83E\uDD47',
  [League.SAPPHIRE]: '\uD83D\uDC8E',
  [League.RUBY]: '\u2764\uFE0F',
  [League.EMERALD]: '\uD83D\uDC9A',
  [League.AMETHYST]: '\uD83D\uDC9C',
  [League.PEARL]: '\uD83E\uDEBB',
  [League.OBSIDIAN]: '\uD83D\uDDA4',
  [League.DIAMOND]: '\uD83D\uDC8E',
};

const ZONE_COLORS: Record<string, string> = {
  promotion: '#E8F5E9',
  safe: '#FFFFFF',
  demotion: '#FFEBEE',
};

/**
 * League Leaderboard Display
 * Epic 3 (AC 3.3): 10-tier league system with 30-person cohorts.
 * Shows promotion (top 10-15) and demotion (bottom 5) zones.
 */
const LeagueDisplay: React.FC<LeagueDisplayProps> = ({
  league,
  entries,
  userRank,
}) => {
  const leagueColor = LEAGUE_COLORS[league];

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.rank === userRank;

    return (
      <View
        style={[
          styles.entryRow,
          { backgroundColor: ZONE_COLORS[item.zone] || '#FFF' },
          isCurrentUser && styles.currentUserRow,
        ]}
      >
        <Text style={styles.rank}>#{item.rank}</Text>
        <Text
          style={[styles.name, isCurrentUser && styles.currentUserName]}
          numberOfLines={1}
        >
          {item.display_name}
        </Text>
        <Text style={styles.xp}>{item.weekly_xp} XP</Text>
        {item.zone === 'promotion' && (
          <Text style={styles.zoneIcon}>{'\u2B06\uFE0F'}</Text>
        )}
        {item.zone === 'demotion' && (
          <Text style={styles.zoneIcon}>{'\u2B07\uFE0F'}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: leagueColor }]}>
        <Text style={styles.leagueEmoji}>{LEAGUE_EMOJI[league]}</Text>
        <Text style={styles.leagueTitle}>{league} League</Text>
        <Text style={styles.leagueEmoji}>{LEAGUE_EMOJI[league]}</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E8F5E9' }]} />
          <Text style={styles.legendText}>Promotion Zone</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFEBEE' }]} />
          <Text style={styles.legendText}>Demotion Zone</Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.user_id}
        renderItem={renderEntry}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  leagueEmoji: {
    fontSize: 28,
  },
  leagueTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  legendText: {
    fontSize: 11,
    color: '#888',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  currentUserRow: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  rank: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  currentUserName: {
    fontWeight: 'bold',
    color: '#1565C0',
  },
  xp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginRight: 8,
  },
  zoneIcon: {
    fontSize: 16,
  },
});

export default LeagueDisplay;
