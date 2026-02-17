import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { sessionApi, gamificationApi, userApi } from '../services/api';
import StreakDisplay from '../components/StreakDisplay';
import XPDisplay from '../components/XPDisplay';
import { GamificationState, UserProfile } from '../types';

interface HomeScreenProps {
  navigation: any;
  userId: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, userId }) => {
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [gamificationRes, userRes] = await Promise.all([
        gamificationApi.getState(userId),
        userApi.get(userId),
      ]);

      setGamification(gamificationRes.data);
      setUserProfile(userRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startLearningSession = async (timerType: 'puppy' | 'gymnast') => {
    try {
      setLoading(true);
      const response = await sessionApi.start({
        user_id: userId,
        session_duration_minutes: 15,
        visual_timer_type: timerType,
      });

      navigation.navigate('Learning', {
        session: response.data.session,
        recommendedConcepts: response.data.recommended_concepts,
        userProfile: response.data.user_profile,
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      Alert.alert('Error', 'Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseStreakFreeze = async () => {
    try {
      const response = await gamificationApi.useStreakFreeze(userId);
      if (response.data.success) {
        Alert.alert('Success', 'Streak freeze used!');
        loadData();
      } else {
        Alert.alert('Error', 'Failed to use streak freeze.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to use streak freeze.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {userProfile?.first_name || 'Student'}! 👋
        </Text>
        <Text style={styles.subtitle}>
          Ready to learn something amazing today?
        </Text>
      </View>

      {gamification && (
        <>
          <View style={styles.section}>
            <XPDisplay
              totalXP={gamification.total_xp}
              weeklyXP={gamification.weekly_xp}
              league={gamification.current_league}
            />
          </View>

          <View style={styles.section}>
            <StreakDisplay
              streak={gamification.current_streak}
              freezes={gamification.streak_freezes}
              onUseFreeze={handleUseStreakFreeze}
            />
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Start Learning</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your timer buddy for today's session:
        </Text>

        <TouchableOpacity
          style={[styles.timerButton, styles.puppyButton]}
          onPress={() => startLearningSession('puppy')}
        >
          <Text style={styles.timerEmoji}>🐶</Text>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerTitle}>Puppy Timer</Text>
            <Text style={styles.timerDescription}>
              Watch a cute puppy walk across the screen!
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timerButton, styles.gymnastButton]}
          onPress={() => startLearningSession('gymnast')}
        >
          <Text style={styles.timerEmoji}>🤸‍♀️</Text>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerTitle}>Gymnast Timer</Text>
            <Text style={styles.timerDescription}>
              Follow a gymnast through her routine!
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Progress')}
        >
          <Text style={styles.secondaryButtonText}>📊 View Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.secondaryButtonText}>🏆 Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  puppyButton: {
    backgroundColor: '#FFF9C4',
  },
  gymnastButton: {
    backgroundColor: '#E1BEE7',
  },
  timerEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  timerTextContainer: {
    flex: 1,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timerDescription: {
    fontSize: 14,
    color: '#666',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default HomeScreen;
