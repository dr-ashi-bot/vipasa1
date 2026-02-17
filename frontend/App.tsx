import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { VideoScreen } from './src/screens/VideoScreen';

type Screen = 'home' | 'session' | 'video';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [sessionData, setSessionData] = useState<{
    math_concepts: string[];
    ela_concepts: string[];
    expires_at: string;
  } | null>(null);

  const handleStartSession = async () => {
    try {
      const { startSession, DEFAULT_USER_ID } = await import('./src/api/client');
      const data = await startSession(DEFAULT_USER_ID);
      setSessionData({
        math_concepts: data.math_concepts ?? [],
        ela_concepts: data.ela_concepts ?? [],
        expires_at: data.expires_at ?? new Date(Date.now() + 18 * 60 * 1000).toISOString(),
      });
      setScreen('session');
    } catch {
      setSessionData({
        math_concepts: ['math_6_integers', 'math_6_equations'],
        ela_concepts: ['ela_4_main_idea'],
        expires_at: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
      });
      setScreen('session');
    }
  };

  const handleSessionExpired = () => {
    setScreen('home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {screen === 'home' && (
        <HomeScreen onStartSession={handleStartSession} />
      )}
      {screen === 'session' && sessionData && (
        <SessionScreen
          sessionData={sessionData}
          onSessionExpired={handleSessionExpired}
        />
      )}
      {screen === 'video' && <VideoScreen />}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, screen === 'home' && styles.tabActive]}
          onPress={() => setScreen('home')}
        >
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, screen === 'video' && styles.tabActive]}
          onPress={() => setScreen('video')}
        >
          <Text style={styles.tabText}>Videos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#e8f5e9',
  },
  tabText: {
    fontSize: 14,
    color: '#5d4037',
  },
});
