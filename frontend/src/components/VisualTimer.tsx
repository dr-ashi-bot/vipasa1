import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface VisualTimerProps {
  totalSeconds: number;
  theme: 'puppy_walk' | 'gymnast_routine';
  onExpired?: () => void;
  startedAt: string;
}

/**
 * Visual Pomodoro Timer
 *
 * Instead of digital numbers (which cause anxiety in pre-teens),
 * this uses a visual representation:
 * - Puppy Walk: A puppy emoji walks across the screen
 * - Gymnast Routine: A gymnast performs a routine across the screen
 *
 * The progress bar fills gradually without showing countdown numbers.
 */
export const VisualTimer: React.FC<VisualTimerProps> = ({
  totalSeconds,
  theme,
  onExpired,
  startedAt,
}) => {
  const [progress, setProgress] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const updateProgress = useCallback(() => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = (now - start) / 1000;
    const newProgress = Math.min(elapsed / totalSeconds, 1);
    setProgress(newProgress);

    if (newProgress >= 1 && !isExpired) {
      setIsExpired(true);
      onExpired?.();
    }
  }, [totalSeconds, startedAt, isExpired, onExpired]);

  useEffect(() => {
    const interval = setInterval(updateProgress, 1000);
    updateProgress();
    return () => clearInterval(interval);
  }, [updateProgress]);

  const icon = theme === 'puppy_walk' ? '🐶' : '🤸‍♀️';
  const label =
    theme === 'puppy_walk'
      ? "Biscuit's Walk"
      : "Ashi's Routine";

  const trackWidth = width - SPACING.xl * 2 - 40;
  const iconPosition = progress * trackWidth;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor:
                  progress < 0.75
                    ? COLORS.primary
                    : progress < 0.9
                      ? COLORS.warning
                      : COLORS.secondary,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.icon,
            {
              transform: [{ translateX: iconPosition }],
            },
          ]}
        >
          {icon}
        </Text>
      </View>
      {isExpired && (
        <View style={styles.expiredBanner}>
          <Text style={styles.expiredText}>
            Great work today! Time to rest. Come back tomorrow! ✨
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  label: {
    ...FONTS.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  trackContainer: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 8,
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
  },
  icon: {
    position: 'absolute',
    fontSize: 24,
    top: 0,
  },
  expiredBanner: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  expiredText: {
    ...FONTS.body,
    color: COLORS.textOnPrimary,
    textAlign: 'center',
  },
});
