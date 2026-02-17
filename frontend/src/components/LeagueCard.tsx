import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, LEAGUE_COLORS } from '../constants/theme';
import type { League, LeaderboardEntry } from '../types';

interface LeagueCardProps {
  league: League;
  rank?: number;
  leaderboard?: LeaderboardEntry[];
}

const LEAGUE_TIERS: League[] = [
  'Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby',
  'Emerald', 'Amethyst', 'Pearl', 'Obsidian', 'Diamond',
];

/**
 * League leaderboard card.
 * Shows the 10-tier system with promotion (top 10-15) and demotion (bottom 5) zones.
 */
export const LeagueCard: React.FC<LeagueCardProps> = ({
  league,
  rank,
  leaderboard = [],
}) => {
  const leagueColor = LEAGUE_COLORS[league] || COLORS.primary;
  const tierIndex = LEAGUE_TIERS.indexOf(league);

  const getZoneStyle = (zone: string) => {
    switch (zone) {
      case 'promotion':
        return { backgroundColor: COLORS.promotionZone };
      case 'demotion':
        return { backgroundColor: COLORS.demotionZone };
      default:
        return { backgroundColor: COLORS.safeZone };
    }
  };

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case 'promotion':
        return '▲ Promotion Zone';
      case 'demotion':
        return '▼ Demotion Zone';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: leagueColor }]}>
        <Text style={styles.leagueEmoji}>
          {getLeagueEmoji(league)}
        </Text>
        <View>
          <Text style={styles.leagueName}>{league} League</Text>
          <Text style={styles.tierText}>
            Tier {tierIndex + 1} of {LEAGUE_TIERS.length}
          </Text>
        </View>
        {rank && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
        )}
      </View>

      {leaderboard.length > 0 && (
        <View style={styles.leaderboardContainer}>
          <Text style={styles.sectionTitle}>This Week's Standings</Text>
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.rank === rank;
            const zoneStyle = getZoneStyle(entry.zone);
            const zoneLabel = getZoneLabel(entry.zone);
            const showZoneLabel =
              index === 0 ||
              leaderboard[index - 1]?.zone !== entry.zone;

            return (
              <View key={entry.user_id}>
                {showZoneLabel && zoneLabel !== '' && (
                  <Text style={styles.zoneLabel}>{zoneLabel}</Text>
                )}
                <View
                  style={[
                    styles.leaderboardRow,
                    zoneStyle,
                    isCurrentUser && styles.currentUserRow,
                  ]}
                >
                  <Text style={styles.rankNumber}>{entry.rank}</Text>
                  <Text
                    style={[
                      styles.userName,
                      isCurrentUser && styles.currentUserText,
                    ]}
                  >
                    {isCurrentUser ? 'You' : `Player ${entry.rank}`}
                  </Text>
                  <Text style={styles.weeklyXp}>{entry.weekly_xp} XP</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

function getLeagueEmoji(league: League): string {
  const emojis: Record<League, string> = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Sapphire: '💎',
    Ruby: '❤️‍🔥',
    Emerald: '💚',
    Amethyst: '💜',
    Pearl: '🤍',
    Obsidian: '🖤',
    Diamond: '💠',
  };
  return emojis[league] || '🏆';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  leagueEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  leagueName: {
    ...FONTS.heading,
    color: COLORS.textOnPrimary,
  },
  tierText: {
    ...FONTS.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  rankBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  rankText: {
    ...FONTS.subheading,
    color: COLORS.textOnPrimary,
  },
  leaderboardContainer: {
    padding: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.subheading,
    marginBottom: SPACING.sm,
  },
  zoneLabel: {
    ...FONTS.caption,
    fontWeight: '600',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 2,
  },
  currentUserRow: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rankNumber: {
    ...FONTS.body,
    fontWeight: '700',
    width: 30,
  },
  userName: {
    ...FONTS.body,
    flex: 1,
  },
  currentUserText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  weeklyXp: {
    ...FONTS.bodySmall,
    fontWeight: '600',
  },
});
