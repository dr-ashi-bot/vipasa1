import React, { useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import VideoPlayer from '../components/VideoPlayer';
import ConfettiOverlay from '../components/ConfettiOverlay';
import { verifyVideo } from '../api/client';

interface VideoScreenProps {
  userId: string;
  videos: {
    video_id: string;
    title: string;
    duration_sec: number;
  }[];
  onBack: () => void;
}

/**
 * Video Learning Screen
 * Epic 5: Khan Academy Video Verification System
 */
const VideoScreen: React.FC<VideoScreenProps> = ({
  userId,
  videos,
  onBack,
}) => {
  const [showConfetti, setShowConfetti] = React.useState(false);

  const handleVideoVerified = useCallback(
    async (
      videoId: string,
      watchDurationSec: number,
      totalDurationSec: number,
      playbackRate: number,
    ) => {
      try {
        const result = await verifyVideo(
          userId,
          videoId,
          watchDurationSec,
          totalDurationSec,
          playbackRate,
        );

        if (result.verified) {
          setShowConfetti(true);
          Alert.alert(
            'XP Earned!',
            `You earned ${result.xp_earned} XP for watching the video!`,
          );
        } else {
          Alert.alert('Not quite!', result.reason ?? 'Video not fully watched.');
        }
      } catch {
        Alert.alert('Error', 'Could not verify video. Please try again.');
      }
    },
    [userId],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ConfettiOverlay
        visible={showConfetti}
        opacity={1.0}
        onComplete={() => setShowConfetti(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {'\uD83C\uDFA5'} Video Lessons
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView>
        {videos.map((video) => (
          <VideoPlayer
            key={video.video_id}
            videoId={video.video_id}
            title={video.title}
            onVerified={(watchDur, totalDur, rate) =>
              handleVideoVerified(
                video.video_id,
                watchDur,
                totalDur,
                rate,
              )
            }
          />
        ))}

        {videos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{'\uD83C\uDFAC'}</Text>
            <Text style={styles.emptyText}>
              No videos available for this topic yet.
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backText: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});

export default VideoScreen;
