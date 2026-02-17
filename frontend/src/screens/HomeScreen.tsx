import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StreakDisplay } from '../components/StreakDisplay';
import { LeagueBadge } from '../components/LeagueBadge';
import { getGamificationState, getQuests, DEFAULT_USER_ID } from '../api/client';

export function HomeScreen({ onStartSession }: { onStartSession: () => void }) {
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState<{
    current_streak: number;
    streak_freezes: number;
    total_xp: number;
    current_league: string;
    weekly_xp: number;
  } | null>(null);
  const [quests, setQuests] = useState<Array<{ title: string; description: string }>>([]);

  useEffect(() => {
    async function load() {
      try {
        const [gam, q] = await Promise.all([
          getGamificationState(DEFAULT_USER_ID),
          getQuests(),
        ]);
        setGamification(gam);
        setQuests(Array.isArray(q) ? q : []);
      } catch {
        setGamification({
          current_streak: 0,
          streak_freezes: 0,
          total_xp: 0,
          current_league: 'Bronze',
          weekly_xp: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStart = () => {
    onStartSession();
  };

  if (loading && !gamification) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7cb342" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi Ashi! 👋</Text>
      <Text style={styles.subtitle}>Ready to learn?</Text>

      {gamification && (
        <View style={styles.stats}>
          <StreakDisplay
            streak={gamification.current_streak}
            streakFreezes={gamification.streak_freezes}
          />
          <LeagueBadge
            league={gamification.current_league}
            weeklyXp={gamification.weekly_xp}
          />
        </View>
      )}

      {quests.length > 0 && (
        <View style={styles.quests}>
          <Text style={styles.questTitle}>Quests</Text>
          {quests.slice(0, 2).map((q, i) => (
            <Text key={i} style={styles.questItem}>
              • {q.title}: {q.description}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleStart}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Starting...' : 'Start Session'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#faf8f5',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#5d4037',
    marginBottom: 24,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quests: {
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f57f17',
    marginBottom: 8,
  },
  questItem: {
    fontSize: 14,
    color: '#5d4037',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#7cb342',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
