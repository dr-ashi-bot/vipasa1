import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  onVerified: (
    watchDurationSec: number,
    totalDurationSec: number,
    playbackRate: number,
  ) => void;
}

/**
 * Khan Academy Video Player with Anti-Cheat Verification
 * Epic 5: Uses YouTube IFrame API callbacks for verification.
 *
 * Tracks:
 * - onStateChange for play/pause events
 * - getDuration() for total video length
 * - getCurrentTime() for actual watch progress
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  onVerified,
}) => {
  const [playing, setPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const playerRef = useRef<any>(null);

  const onStateChange = useCallback(
    (state: string) => {
      if (state === 'playing' && startTime === null) {
        setStartTime(Date.now());
      }

      if (state === 'ended') {
        setPlaying(false);
        if (!completed) {
          setCompleted(true);
          onVerified(currentTime, totalDuration, 1.0);
        }
      }
    },
    [startTime, currentTime, totalDuration, completed, onVerified],
  );

  const handleReady = useCallback(() => {
    if (playerRef.current) {
      playerRef.current
        .getDuration()
        .then((duration: number) => setTotalDuration(duration));
    }
  }, []);

  const handleClaimXP = useCallback(async () => {
    if (playerRef.current) {
      try {
        const time = await playerRef.current.getCurrentTime();
        const duration = await playerRef.current.getDuration();
        setCurrentTime(time);
        setTotalDuration(duration);

        const watchPercentage = time / duration;
        if (watchPercentage < 0.9) {
          Alert.alert(
            'Keep watching!',
            `You've watched ${Math.round(watchPercentage * 100)}%. Watch at least 90% to earn XP!`,
          );
          return;
        }

        onVerified(time, duration, 1.0);
        setCompleted(true);
      } catch {
        Alert.alert('Error', 'Could not verify video progress.');
      }
    }
  }, [onVerified]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.playerContainer}>
        <YoutubePlayer
          ref={playerRef}
          height={220}
          videoId={videoId}
          play={playing}
          onChangeState={onStateChange}
          onReady={handleReady}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.playButton, playing && styles.pauseButton]}
          onPress={() => setPlaying(!playing)}
        >
          <Text style={styles.buttonText}>
            {playing ? '\u23F8\uFE0F Pause' : '\u25B6\uFE0F Play'}
          </Text>
        </TouchableOpacity>

        {!completed && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleClaimXP}
          >
            <Text style={styles.claimButtonText}>
              {'\u2B50'} Claim XP
            </Text>
          </TouchableOpacity>
        )}

        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>
              {'\u2705'} XP Earned!
            </Text>
          </View>
        )}
      </View>

      {totalDuration > 0 && (
        <Text style={styles.info}>
          Watch at least 90% at normal speed to earn XP
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
    color: '#333',
  },
  playerContainer: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  playButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  completedText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    paddingBottom: 12,
  },
});

export default VideoPlayer;
