import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { LeagueCard } from '../components/LeagueCard';
import type { League, LeaderboardEntry } from '../types';

/**
 * League Screen: Shows the 10-tier leaderboard with
 * promotion and demotion zones.
 */
export const LeagueScreen: React.FC = () => {
  const [currentLeague] = useState<League>('Bronze');
  const [rank] = useState(8);

  // Demo leaderboard data for a 30-person cohort
  const [leaderboard] = useState<LeaderboardEntry[]>(
    Array.from({ length: 30 }, (_, i) => ({
      user_id: `user_${i + 1}`,
      weekly_xp: Math.max(0, 500 - i * 15 + Math.floor(Math.random() * 20)),
      league: currentLeague,
      rank: i + 1,
      zone:
        i < 15
          ? ('promotion' as const)
          : i >= 25
            ? ('demotion' as const)
            : ('safe' as const),
    })),
  );

  const LEAGUE_ORDER: League[] = [
    'Bronze',
    'Silver',
    'Gold',
    'Sapphire',
    'Ruby',
    'Emerald',
    'Amethyst',
    'Pearl',
    'Obsidian',
    'Diamond',
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Leagues</Text>
      <Text style={styles.subtitle}>
        Compete weekly! Top players get promoted.
      </Text>

      {/* League progression */}
      <View style={styles.tierOverview}>
        {LEAGUE_ORDER.map((tier, index) => {
          const isCurrent = tier === currentLeague;
          return (
            <View
              key={tier}
              style={[
                styles.tierBadge,
                isCurrent && styles.currentTierBadge,
              ]}
            >
              <Text style={styles.tierEmoji}>
                {isCurrent ? '📍' : index < LEAGUE_ORDER.indexOf(currentLeague) ? '✅' : '🔒'}
              </Text>
              <Text
                style={[
                  styles.tierName,
                  isCurrent && styles.currentTierName,
                ]}
              >
                {tier}
              </Text>
            </View>
          );
        })}
      </View>

      <LeagueCard
        league={currentLeague}
        rank={rank}
        leaderboard={leaderboard}
      />

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  title: {
    ...FONTS.title,
    marginTop: SPACING.md,
  },
  subtitle: {
    ...FONTS.bodySmall,
    marginBottom: SPACING.lg,
  },
  tierOverview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tierBadge: {
    alignItems: 'center',
    padding: SPACING.xs,
    borderRadius: 8,
    width: 60,
  },
  currentTierBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  tierEmoji: {
    fontSize: 18,
  },
  tierName: {
    ...FONTS.caption,
    marginTop: 2,
    textAlign: 'center',
  },
  currentTierName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
