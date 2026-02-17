import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { XpDisplay } from '../components/XpDisplay';
import { StreakBadge } from '../components/StreakBadge';
import { QuestCard } from '../components/QuestCard';
import type { Quest, League } from '../types';

interface HomeScreenProps {
  navigation: any;
}

/**
 * Home Screen: The main dashboard showing user progress,
 * streaks, quests, and quick-start learning buttons.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [totalXp, setTotalXp] = useState(250);
  const [streak, setStreak] = useState(3);
  const [league, setLeague] = useState<League>('Bronze');
  const [quests, setQuests] = useState<Quest[]>([
    {
      quest_id: '1',
      title: 'Speed Solver',
      description: 'Solve 5 problems in 3 minutes',
      target: 5,
      progress: 2,
      expires_at: new Date().toISOString(),
      type: 'daily',
    },
    {
      quest_id: '2',
      title: 'Knowledge Seeker',
      description: 'Watch 2 educational videos',
      target: 2,
      progress: 0,
      expires_at: new Date().toISOString(),
      type: 'daily',
    },
    {
      quest_id: '3',
      title: 'February Quest',
      description: 'Complete 100 problems this February',
      target: 100,
      progress: 23,
      expires_at: new Date().toISOString(),
      type: 'monthly',
    },
  ]);

  const startLearningSession = (track?: 'math' | 'ela') => {
    navigation.navigate('Learning', { track });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, Ashi! 👋</Text>
          <Text style={styles.subGreeting}>Ready to learn today?</Text>
        </View>
        <XpDisplay totalXp={totalXp} />
      </View>

      <StreakBadge streak={streak} freezesAvailable={1} />

      <View style={styles.trackSection}>
        <Text style={styles.sectionTitle}>Start Learning</Text>
        <View style={styles.trackButtons}>
          <TouchableOpacity
            style={[styles.trackButton, styles.mathButton]}
            onPress={() => startLearningSession('math')}
          >
            <Text style={styles.trackEmoji}>🔢</Text>
            <Text style={styles.trackButtonTitle}>Math</Text>
            <Text style={styles.trackButtonDesc}>
              6th Grade - Beast Academy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.trackButton, styles.elaButton]}
            onPress={() => startLearningSession('ela')}
          >
            <Text style={styles.trackEmoji}>📖</Text>
            <Text style={styles.trackButtonTitle}>Reading</Text>
            <Text style={styles.trackButtonDesc}>
              4th Grade - Comprehension
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.mixedButton}
          onPress={() => startLearningSession()}
        >
          <Text style={styles.mixedButtonText}>
            🌟 Mixed Practice (Both Tracks)
          </Text>
        </TouchableOpacity>
      </View>

      <QuestCard quests={quests} />

      <TouchableOpacity
        style={styles.leaguePreview}
        onPress={() => navigation.navigate('League')}
      >
        <Text style={styles.leagueEmoji}>🏆</Text>
        <View style={styles.leagueInfo}>
          <Text style={styles.leagueName}>{league} League</Text>
          <Text style={styles.leagueAction}>View Leaderboard →</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.videoSection}
        onPress={() => navigation.navigate('Videos')}
      >
        <Text style={styles.videoEmoji}>🎥</Text>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>Watch & Learn</Text>
          <Text style={styles.videoDesc}>
            Khan Academy videos for extra XP
          </Text>
        </View>
      </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  greeting: {
    ...FONTS.title,
  },
  subGreeting: {
    ...FONTS.bodySmall,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    ...FONTS.heading,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  trackSection: {
    marginTop: SPACING.sm,
  },
  trackButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  trackButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  mathButton: {
    backgroundColor: COLORS.primary,
  },
  elaButton: {
    backgroundColor: COLORS.secondary,
  },
  trackEmoji: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  trackButtonTitle: {
    ...FONTS.subheading,
    color: COLORS.textOnPrimary,
  },
  trackButtonDesc: {
    ...FONTS.caption,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  mixedButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  mixedButtonText: {
    ...FONTS.button,
    color: COLORS.text,
  },
  leaguePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  leagueEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    ...FONTS.subheading,
  },
  leagueAction: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
  },
  videoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  videoEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    ...FONTS.subheading,
  },
  videoDesc: {
    ...FONTS.bodySmall,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
