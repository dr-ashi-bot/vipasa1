import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { VideoPlayer } from '../components/VideoPlayer';
import type { VideoVerificationResult } from '../types';

interface VideoItem {
  video_id: string;
  title: string;
  youtube_id: string;
  duration_sec: number;
  concept_id: string;
  concept_name: string;
}

/**
 * Videos Screen: Khan Academy video player with verification.
 * Awards XP only if the user watches at least 90% at normal speed.
 */
export const VideosScreen: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const videos: VideoItem[] = [
    {
      video_id: 'vid_int_ops_1',
      title: 'Adding & Subtracting Integers',
      youtube_id: 'iETmblMFNjQ',
      duration_sec: 480,
      concept_id: 'math_6_integer_ops',
      concept_name: 'Integer Operations',
    },
    {
      video_id: 'vid_geo_3d_1',
      title: 'Volume of Rectangular Prisms',
      youtube_id: 'qJwecTgce6c',
      duration_sec: 360,
      concept_id: 'math_6_geometry_3d',
      concept_name: '3D Geometry',
    },
    {
      video_id: 'vid_equations_1',
      title: 'Solving Multi-Step Equations',
      youtube_id: 'l3XzepN03KQ',
      duration_sec: 420,
      concept_id: 'math_6_equations',
      concept_name: 'Equations',
    },
    {
      video_id: 'vid_ratios_1',
      title: 'Intro to Ratios',
      youtube_id: 'HpdMJaKaXnA',
      duration_sec: 300,
      concept_id: 'math_6_ratios',
      concept_name: 'Ratios',
    },
  ];

  const handleVerified = (result: VideoVerificationResult) => {
    if (result.verified) {
      // XP was awarded - could update local state or trigger confetti
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Watch & Learn</Text>
      <Text style={styles.subtitle}>
        Watch Khan Academy videos to earn XP! You need to watch at least 90%
        of each video.
      </Text>

      {selectedVideo ? (
        <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedVideo(null)}
          >
            <Text style={styles.backButtonText}>← Back to Videos</Text>
          </TouchableOpacity>
          <VideoPlayer
            videoId={selectedVideo.youtube_id}
            title={selectedVideo.title}
            durationSec={selectedVideo.duration_sec}
            userId="demo_user"
            videoDbId={selectedVideo.video_id}
            onVerified={handleVerified}
          />
        </View>
      ) : (
        <View style={styles.videoList}>
          {videos.map((video) => (
            <TouchableOpacity
              key={video.video_id}
              style={styles.videoCard}
              onPress={() => setSelectedVideo(video)}
            >
              <View style={styles.thumbnail}>
                <Text style={styles.playIcon}>▶️</Text>
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoConcept}>
                  📚 {video.concept_name}
                </Text>
                <Text style={styles.videoDuration}>
                  ⏱ {Math.floor(video.duration_sec / 60)} min
                </Text>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpBadgeText}>+15 XP</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
  title: {
    ...FONTS.title,
    marginTop: SPACING.md,
  },
  subtitle: {
    ...FONTS.bodySmall,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  videoList: {
    gap: SPACING.md,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
  },
  videoInfo: {
    flex: 1,
    padding: SPACING.md,
  },
  videoTitle: {
    ...FONTS.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  videoConcept: {
    ...FONTS.caption,
    marginBottom: SPACING.xs,
  },
  videoDuration: {
    ...FONTS.caption,
  },
  xpBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  xpBadgeText: {
    ...FONTS.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
