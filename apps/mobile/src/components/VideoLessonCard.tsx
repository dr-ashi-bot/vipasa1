import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import YoutubePlayer, { type YoutubeIframeRef } from "react-native-youtube-iframe";
import { verifyVideo } from "../api/client";

interface VideoLessonCardProps {
  userId: string;
  videoId: string;
  onVerified: (payload: { verified: boolean; xp_delta: number; opacity: number }) => void;
}

export function VideoLessonCard({ userId, videoId, onVerified }: VideoLessonCardProps) {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [playing, setPlaying] = useState(false);
  const [seekEvents, setSeekEvents] = useState(0);
  const [maxWatchTime, setMaxWatchTime] = useState(0);
  const [lastKnownTime, setLastKnownTime] = useState(0);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }

    const interval = setInterval(async () => {
      const now = await playerRef.current?.getCurrentTime();
      if (typeof now !== "number") return;

      if (now - lastKnownTime > 4.5) {
        setSeekEvents((value) => value + 1);
      }
      setLastKnownTime(now);
      setMaxWatchTime((value) => Math.max(value, now));
    }, 1200);

    return () => clearInterval(interval);
  }, [lastKnownTime, playing]);

  const handleStateChange = async (state: string) => {
    if (state === "playing") {
      setPlaying(true);
      return;
    }

    if (state === "paused" || state === "buffering") {
      setPlaying(false);
      return;
    }

    if (state === "ended") {
      setPlaying(false);
      const duration = (await playerRef.current?.getDuration()) ?? 1;
      const currentTime = (await playerRef.current?.getCurrentTime()) ?? maxWatchTime;
      const watchDuration = Math.max(maxWatchTime, currentTime);

      try {
        const response = (await verifyVideo({
          user_id: userId,
          video_id: videoId,
          watch_duration_sec: watchDuration,
          video_duration_sec: duration,
          playback_rate_avg: 1,
          seek_events: seekEvents,
        })) as {
          verified: boolean;
          xp_delta: number;
          confetti?: { opacity?: number };
          reason?: string;
        };

        onVerified({
          verified: response.verified,
          xp_delta: response.xp_delta ?? 0,
          opacity: response.confetti?.opacity ?? 1,
        });
        if (!response.verified) {
          Alert.alert("Video not verified yet", response.reason ?? "Please watch at normal speed.");
        }
      } catch (error) {
        Alert.alert("Verification failed", (error as Error).message);
      }
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Khan Academy Video Challenge</Text>
      <Text style={styles.subtitle}>Watch at least 90% with no skipping to earn XP.</Text>
      <YoutubePlayer ref={playerRef} height={220} play={playing} videoId={videoId} onChangeState={handleStateChange} />
      <Text style={styles.status}>Seek checks detected: {seekEvents}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
  },
  subtitle: {
    marginTop: 4,
    color: "#166534",
    marginBottom: 8,
  },
  status: {
    marginTop: 8,
    color: "#166534",
  },
});
