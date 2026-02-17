import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface VisualTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  timerType: 'puppy' | 'gymnast';
}

const { width } = Dimensions.get('window');

const VisualTimer: React.FC<VisualTimerProps> = ({
  remainingSeconds,
  totalSeconds,
  timerType,
}) => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    const progressValue = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [remainingSeconds, totalSeconds]);

  const progressInterpolate = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const emoji = timerType === 'puppy' ? '🐶' : '🤸‍♀️';

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressInterpolate,
            },
          ]}
        />
        <Animated.Text
          style={[
            styles.emoji,
            {
              left: progressInterpolate,
            },
          ]}
        >
          {emoji}
        </Animated.Text>
      </View>
      <Text style={styles.timeText}>
        {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  track: {
    height: 40,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  emoji: {
    position: 'absolute',
    fontSize: 32,
    top: 4,
    marginLeft: -16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
});

export default VisualTimer;
