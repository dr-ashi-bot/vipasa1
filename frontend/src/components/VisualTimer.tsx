import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_TRACK_WIDTH = SCREEN_WIDTH - 60;

interface VisualTimerProps {
  totalSeconds: number;
  theme: 'puppy_walk' | 'gymnast_routine';
  onExpired: () => void;
  isPaused?: boolean;
}

/**
 * Visual Timer Component (Epic 4: Neuroscience Session Management)
 *
 * No digital countdown numbers - uses a visual metaphor:
 * - Puppy walking across the screen
 * - Gymnast completing a routine
 *
 * This reduces anxiety in pre-teens while still communicating time.
 */
const VisualTimer: React.FC<VisualTimerProps> = ({
  totalSeconds,
  theme,
  onExpired,
  isPaused = false,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [animValue] = useState(new Animated.Value(0));

  const progressFraction = 1 - remainingSeconds / totalSeconds;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onExpired]);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progressFraction,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progressFraction, animValue]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TIMER_TRACK_WIDTH - 40],
  });

  const trackColor = animValue.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: ['#4CAF50', '#8BC34A', '#FF9800', '#F44336'],
  });

  const getThemeEmoji = useCallback(() => {
    if (theme === 'puppy_walk') return '\uD83D\uDC36';
    return '\uD83E\uDD38\u200D\u2640\uFE0F';
  }, [theme]);

  const getThemeLabel = useCallback(() => {
    if (theme === 'puppy_walk') return 'Puppy is on a walk!';
    return 'Gymnast is performing!';
  }, [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getThemeLabel()}</Text>

      {/* Visual track */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.trackFill,
            {
              width: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: trackColor,
            },
          ]}
        />

        {/* Animated character */}
        <Animated.View
          style={[styles.character, { transform: [{ translateX }] }]}
        >
          <Text style={styles.characterEmoji}>{getThemeEmoji()}</Text>
        </Animated.View>

        {/* Start and end markers */}
        <View style={styles.startMarker}>
          <Text style={styles.markerEmoji}>{'\uD83C\uDFE0'}</Text>
        </View>
        <View style={styles.endMarker}>
          <Text style={styles.markerEmoji}>{'\u2B50'}</Text>
        </View>
      </View>

      {/* Progress dots instead of numbers */}
      <View style={styles.dotsContainer}>
        {[0.25, 0.5, 0.75].map((mark, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              progressFraction >= mark && styles.dotCompleted,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  track: {
    height: 40,
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    opacity: 0.3,
  },
  character: {
    position: 'absolute',
    top: -8,
    zIndex: 10,
  },
  characterEmoji: {
    fontSize: 36,
  },
  startMarker: {
    position: 'absolute',
    left: -5,
    top: -5,
  },
  endMarker: {
    position: 'absolute',
    right: -5,
    top: -5,
  },
  markerEmoji: {
    fontSize: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DDD',
  },
  dotCompleted: {
    backgroundColor: '#4CAF50',
  },
});

export default VisualTimer;
