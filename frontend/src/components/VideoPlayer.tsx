import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { apiService } from '../services/api';
import type { VideoVerificationResult } from '../types';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  durationSec: number;
  userId: string;
  videoDbId: string;
  onVerified?: (result: VideoVerificationResult) => void;
}

/**
 * Khan Academy Video Player with Anti-Cheat Verification.
 *
 * Uses YouTube IFrame API callbacks:
 * - onStateChange: Track play/pause states
 * - getDuration(): Total video length
 * - getCurrentTime(): Actual watch position
 *
 * Only awards XP if user watched >= 90% at normal speed.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  durationSec,
  userId,
  videoDbId,
  onVerified,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const onStateChange = useCallback(
    (state: string) => {
      if (state === 'playing') {
        if (!startTime) {
          setStartTime(Date.now() / 1000);
        }
        setIsPlaying(true);

        intervalRef.current = setInterval(async () => {
          if (playerRef.current) {
            try {
              const currentTime =
                await playerRef.current.getCurrentTime();
              setWatchedSeconds(currentTime);
            } catch {
              // Player might not be ready
            }
          }
        }, 5000);
      } else if (state === 'paused' || state === 'ended') {
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        if (state === 'ended') {
          handleVideoEnd();
        }
      }
    },
    [startTime],
  );

  const handleVideoEnd = async () => {
    if (!startTime || isVerified) return;

    const endTime = Date.now() / 1000;

    try {
      const result = await apiService.verifyVideo({
        user_id: userId,
        video_id: videoDbId,
        video_duration_sec: durationSec,
        watch_duration_sec: watchedSeconds,
        start_time: startTime,
        end_time: endTime,
      });

      setIsVerified(true);
      onVerified?.(result);

      if (result.verified) {
        Alert.alert(
          'Great job!',
          `You earned ${result.xp_awarded} XP for watching this video!`,
        );
      } else {
        Alert.alert(
          'Almost there!',
          result.reason || 'Please watch more of the video to earn XP.',
        );
      }
    } catch (error) {
      console.error('Video verification failed:', error);
    }
  };

  const progress =
    durationSec > 0
      ? Math.min(watchedSeconds / durationSec, 1)
      : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.playerWrapper}>
        <YoutubePlayer
          ref={playerRef}
          height={220}
          videoId={videoId}
          play={isPlaying}
          onChangeState={onStateChange}
        />
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}% watched
        </Text>
      </View>
      {isVerified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✅ Verified & XP Awarded</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  title: {
    ...FONTS.subheading,
    padding: SPACING.md,
  },
  playerWrapper: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressContainer: {
    padding: SPACING.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.round,
  },
  progressText: {
    ...FONTS.caption,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  verifiedBadge: {
    backgroundColor: COLORS.success,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  verifiedText: {
    ...FONTS.body,
    color: COLORS.textOnPrimary,
    fontWeight: '600',
  },
});
