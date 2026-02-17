import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import LeagueDisplay from '../components/LeagueDisplay';
import { League, LeaderboardEntry } from '../types';

interface LeaderboardScreenProps {
  league: League;
  entries: LeaderboardEntry[];
  userRank: number;
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  league,
  entries,
  userRank,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>
          {'\u2190'} Back
        </Text>
      </TouchableOpacity>

      <ScrollView>
        <LeagueDisplay
          league={league}
          entries={entries}
          userRank={userRank}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: '600',
  },
});

export default LeaderboardScreen;
