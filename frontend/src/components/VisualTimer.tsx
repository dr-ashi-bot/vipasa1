import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VisualTimerProps {
  durationMinutes: number;
  expiresAt: Date;
  onExpire: () => void;
}

export function VisualTimer({ durationMinutes, expiresAt, onExpire }: VisualTimerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalMs = durationMinutes * 60 * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = new Date(expiresAt).getTime() - now;
      if (remaining <= 0) {
        clearInterval(interval);
        setProgress(1);
        onExpire();
        return;
      }
      setProgress(1 - remaining / totalMs);
    }, 500);
    return () => clearInterval(interval);
  }, [durationMinutes, expiresAt, onExpire]);

  const fillPercent = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Focus time — puppy is walking to the finish!</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: fillPercent }]} />
        <View style={[styles.empty, { flex: 1 - fillPercent }]} />
      </View>
      <Text style={styles.hint}>
        {progress >= 1 ? 'Session complete! Come back tomorrow.' : 'Keep going!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f0e8',
    borderRadius: 12,
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#5c4a3a',
    marginBottom: 8,
    textAlign: 'center',
  },
  track: {
    height: 24,
    flexDirection: 'row',
    backgroundColor: '#e8ddd0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: '#7cb342',
    borderRadius: 12,
    minWidth: 0,
  },
  empty: {
    height: '100%',
    backgroundColor: 'transparent',
    minWidth: 0,
  },
  hint: {
    fontSize: 12,
    color: '#8d6e63',
    marginTop: 8,
    textAlign: 'center',
  },
});
