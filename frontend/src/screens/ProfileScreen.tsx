import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { MasteryProgressBar } from '../components/MasteryProgressBar';
import type { League } from '../types';

export const ProfileScreen: React.FC = () => {
  const [profile] = useState({
    name: 'Ashi',
    interests: ['gymnastics', 'cute puppies'],
    mathLevel: 6,
    elaLevel: 4,
    totalXp: 250,
    streak: 3,
    league: 'Bronze' as League,
  });

  const mathConcepts = [
    { name: 'Integer Operations', mastery: 0.25 },
    { name: 'Advanced Fractions', mastery: 0.1 },
    { name: 'Ratios & Proportions', mastery: 0.1 },
    { name: '2D Geometry & Area', mastery: 0.15 },
    { name: '3D Solids & Volume', mastery: 0.1 },
    { name: 'Algebraic Expressions', mastery: 0.1 },
    { name: 'Multi-Step Equations', mastery: 0.1 },
    { name: 'Statistics & Data', mastery: 0.1 },
    { name: 'Number Theory Puzzles', mastery: 0.1 },
    { name: 'Coordinate Plane', mastery: 0.1 },
  ];

  const elaConcepts = [
    { name: 'Main Idea & Details', mastery: 0.2 },
    { name: 'Vocabulary in Context', mastery: 0.15 },
    { name: 'Making Inferences', mastery: 0.1 },
    { name: 'Sequencing Events', mastery: 0.1 },
    { name: 'Cause and Effect', mastery: 0.1 },
    { name: 'Compare & Contrast', mastery: 0.1 },
    { name: 'Grammar & Mechanics', mastery: 0.1 },
    { name: 'Paragraph Writing', mastery: 0.1 },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🤸‍♀️</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.interests}>
          Loves {profile.interests.join(' & ')}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>⭐ {profile.totalXp}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {profile.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🏆 {profile.league}</Text>
          <Text style={styles.statLabel}>League</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          🔢 Math Mastery (Grade {profile.mathLevel})
        </Text>
        <Text style={styles.sectionSubtitle}>Beast Academy Level</Text>
        {mathConcepts.map((concept) => (
          <MasteryProgressBar
            key={concept.name}
            conceptName={concept.name}
            subject="math"
            mastery={concept.mastery}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📖 Reading Mastery (Grade {profile.elaLevel})
        </Text>
        <Text style={styles.sectionSubtitle}>4th-Grade Lexile Level</Text>
        {elaConcepts.map((concept) => (
          <MasteryProgressBar
            key={concept.name}
            conceptName={concept.name}
            subject="ela"
            mastery={concept.mastery}
          />
        ))}
      </View>

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
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  name: {
    ...FONTS.title,
  },
  interests: {
    ...FONTS.bodySmall,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statValue: {
    ...FONTS.subheading,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...FONTS.caption,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    ...FONTS.subheading,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...FONTS.caption,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
