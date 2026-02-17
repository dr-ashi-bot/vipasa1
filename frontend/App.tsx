import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import LearningScreen from './src/screens/LearningScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import VideoScreen from './src/screens/VideoScreen';
import {
  SessionResponse,
  ContentResponse,
  ProgressResponse,
  League,
  LeaderboardEntry,
} from './src/types';

type Screen = 'home' | 'learning' | 'leaderboard' | 'video';

/**
 * Main Application Entry Point
 *
 * Adaptive Learning Platform for Ashi
 * - Dual-Track BKT Engine (Math Grade 6, ELA Grade 4)
 * - RAG-Powered Socratic AI Tutor
 * - Gamification with Flow State Design
 * - Neuroscience Session Management
 * - Khan Academy Video Verification
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(false);

  // Mock user ID (in production, retrieved from auth)
  const userId = '00000000-0000-0000-0000-000000000001';

  const handleStartSession = useCallback(async () => {
    setLoading(true);
    try {
      // In production, call: const session = await startSession(userId, 15);
      // For now, use local mock data
      const mockSession: SessionResponse = {
        session_id: 'session-' + Date.now(),
        duration_minutes: 15,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        learning_path: {
          math_next: {
            concept_id: 'math_6_geometry_3d_solids',
            mastery: 0.15,
          },
          ela_next: {
            concept_id: 'ela_4_reading_comprehension',
            mastery: 0.2,
          },
        },
        visual_timer: {
          type: 'animated_progress',
          theme: 'puppy_walk',
          total_seconds: 15 * 60,
        },
        streak_info: {
          current_streak: 3,
          streak_freezes: 1,
          streak_restored: false,
        },
        quests: {
          daily_quests: {
            speed_challenge: {
              title: 'Solve 5 problems in 3 minutes',
              target: 5,
              current: 0,
              completed: false,
            },
            streak_quest: {
              title: 'Get a 3-answer streak',
              target: 3,
              current: 0,
              completed: false,
            },
            explorer: {
              title: 'Practice 2 different topics',
              target: 2,
              current: 0,
              completed: false,
            },
          },
          monthly_quest: {
            title: 'February Quest',
            target: 100,
            current: 23,
            completed: false,
          },
        },
      };

      setSessionData(mockSession);
      setCurrentScreen('learning');
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleGenerateContent = useCallback(
    async (
      conceptId: string,
      previousAnswer?: string,
    ): Promise<ContentResponse> => {
      // In production: return await generateContent(userId, conceptId, previousAnswer, sessionData?.session_id);
      return {
        content: {
          story_text:
            'Ashi was at gymnastics practice when she noticed the gym had been redecorated with 3D shapes! ' +
            'Her coach placed a cute puppy-shaped trophy on a pedestal that looked like a rectangular prism.',
          question:
            'The pedestal is 2 feet long, 1.5 feet wide, and 3 feet tall. ' +
            'What is the volume of the pedestal in cubic feet?',
          options: [
            'A) 6.5 cubic feet',
            'B) 9 cubic feet',
            'C) 7.5 cubic feet',
            'D) 13 cubic feet',
          ],
          correct_answer: 'B',
          hint: 'Remember, to find the volume of a rectangular prism, multiply length x width x height!',
          explanation:
            'Volume = length x width x height = 2 x 1.5 x 3 = 9 cubic feet. Great job!',
          story_continuation:
            'With the volume calculated, Ashi realized the pedestal was the perfect size for the puppy trophy! ' +
            'But then her coach revealed a surprise challenge involving pyramids...',
          socratic_question: previousAnswer
            ? "What do you think happens when we multiply three numbers together? Let's think about what each number represents..."
            : undefined,
          encouragement: previousAnswer
            ? "You're so close! Let's think about this step by step."
            : undefined,
        },
        mastery_level: 0.15,
        concept_id: conceptId,
        track: conceptId.startsWith('ela') ? 'ela' : 'math',
      };
    },
    [userId, sessionData],
  );

  const handleSubmitAnswer = useCallback(
    async (
      conceptId: string,
      isCorrect: boolean,
    ): Promise<ProgressResponse> => {
      // In production: return await submitProgress(userId, conceptId, isCorrect);
      const newXP = isCorrect ? 10 : 0;
      setTotalXP((prev) => prev + newXP);

      return {
        mastery: {
          concept_id: conceptId,
          probability_known: isCorrect ? 0.25 : 0.12,
          is_mastered: false,
          total_attempts: 1,
          correct_attempts: isCorrect ? 1 : 0,
        },
        gamification: {
          xp_earned: newXP,
          total_xp: totalXP + newXP,
          consecutive_correct: isCorrect ? 1 : 0,
          confetti_opacity: 1.0,
          confetti_frequency: 1.0,
          show_confetti: isCorrect,
          streak: 3,
        },
      };
    },
    [userId, totalXP],
  );

  const handleSessionExpired = useCallback(() => {
    // Zeigarnik Effect: session ended, encourage return
  }, []);

  // Sample leaderboard data
  const sampleLeaderboard: LeaderboardEntry[] = Array.from(
    { length: 30 },
    (_, i) => ({
      user_id: `user-${i}`,
      display_name:
        i === 0
          ? 'Ashi (You)'
          : ['Maya', 'Leo', 'Sofia', 'Kai', 'Luna', 'Finn', 'Aria', 'Zara'][
              i % 8
            ] + ` ${i}`,
      weekly_xp: 500 - i * 15 + Math.floor(Math.random() * 20),
      rank: i + 1,
      zone: i < 10 ? 'promotion' : i >= 25 ? 'demotion' : 'safe',
    }),
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Preparing your adventure...</Text>
      </View>
    );
  }

  switch (currentScreen) {
    case 'learning':
      return sessionData ? (
        <LearningScreen
          session={sessionData}
          onGenerateContent={handleGenerateContent}
          onSubmitAnswer={handleSubmitAnswer}
          onSessionExpired={handleSessionExpired}
          onBack={() => setCurrentScreen('home')}
        />
      ) : null;

    case 'leaderboard':
      return (
        <LeaderboardScreen
          league={League.BRONZE}
          entries={sampleLeaderboard}
          userRank={1}
          onBack={() => setCurrentScreen('home')}
        />
      );

    case 'video':
      return (
        <VideoScreen
          userId={userId}
          videos={[
            {
              video_id: 'bBshhtadnPQ',
              title: 'Intro to 3D Shapes - Khan Academy',
              duration_sec: 360,
            },
            {
              video_id: 'qJwecTgce6c',
              title: 'Volume of Rectangular Prisms',
              duration_sec: 420,
            },
          ]}
          onBack={() => setCurrentScreen('home')}
        />
      );

    default:
      return (
        <HomeScreen
          onStartSession={handleStartSession}
          onOpenLeaderboard={() => setCurrentScreen('leaderboard')}
          onOpenProfile={() => setCurrentScreen('video')}
          sessionData={sessionData}
          totalXP={totalXP}
        />
      );
  }
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
