import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import StreakDisplay from '../components/StreakDisplay';
import QuestPanel from '../components/QuestPanel';
import { SessionResponse } from '../types';

interface HomeScreenProps {
  onStartSession: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  sessionData?: SessionResponse | null;
  totalXP: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSession,
  onOpenLeaderboard,
  onOpenProfile,
  sessionData,
  totalXP,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, Ashi! {'\uD83D\uDC4B'}</Text>
            <Text style={styles.subtitle}>Ready to learn today?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onOpenProfile}
          >
            <Text style={styles.profileEmoji}>{'\uD83D\uDC67'}</Text>
          </TouchableOpacity>
        </View>

        {/* XP Display */}
        <View style={styles.xpBanner}>
          <Text style={styles.xpIcon}>{'\u2B50'}</Text>
          <Text style={styles.xpText}>{totalXP} XP</Text>
          <TouchableOpacity onPress={onOpenLeaderboard}>
            <Text style={styles.leagueButton}>
              {'\uD83C\uDFC6'} Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Streak */}
        <StreakDisplay
          currentStreak={sessionData?.streak_info.current_streak ?? 0}
          streakFreezes={sessionData?.streak_info.streak_freezes ?? 1}
        />

        {/* Start Session Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartSession}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonEmoji}>{'\uD83D\uDE80'}</Text>
          <Text style={styles.startButtonText}>Start Learning!</Text>
          <Text style={styles.startButtonSub}>15 min focus session</Text>
        </TouchableOpacity>

        {/* Learning Tracks */}
        <View style={styles.tracksContainer}>
          <Text style={styles.sectionTitle}>Your Learning Tracks</Text>

          <View style={styles.trackCard}>
            <Text style={styles.trackEmoji}>{'\uD83D\uDCCA'}</Text>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>Math - Grade 6</Text>
              <Text style={styles.trackDesc}>
                Beast Academy puzzles & discovery
              </Text>
            </View>
            <View
              style={[styles.trackLevel, { backgroundColor: '#E3F2FD' }]}
            >
              <Text style={styles.trackLevelText}>Lv 6</Text>
            </View>
          </View>

          <View style={styles.trackCard}>
            <Text style={styles.trackEmoji}>{'\uD83D\uDCDA'}</Text>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>Reading & Writing - Grade 4</Text>
              <Text style={styles.trackDesc}>
                Building comprehension skills
              </Text>
            </View>
            <View
              style={[styles.trackLevel, { backgroundColor: '#FFF3E0' }]}
            >
              <Text style={styles.trackLevelText}>Lv 4</Text>
            </View>
          </View>
        </View>

        {/* Quests */}
        {sessionData?.quests && (
          <QuestPanel
            dailyQuests={
              (sessionData.quests as any).daily_quests ?? {}
            }
            monthlyQuest={
              (sessionData.quests as any).monthly_quest
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 28,
  },
  xpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  xpIcon: {
    fontSize: 24,
  },
  xpText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F57F17',
    flex: 1,
  },
  leagueButton: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  startButtonSub: {
    fontSize: 14,
    color: '#C8E6C9',
    marginTop: 4,
  },
  tracksContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  trackEmoji: {
    fontSize: 32,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  trackDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  trackLevel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trackLevelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});

export default HomeScreen;
