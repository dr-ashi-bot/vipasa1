import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import YoutubeIframe, { PLAYER_STATES } from 'react-native-youtube-iframe';
import { verifyVideo, DEFAULT_USER_ID } from '../api/client';
import { ConfettiOverlay } from '../components/ConfettiOverlay';

const KHAN_ACADEMY_VIDEO_ID = 'R9hR3Cj8Vho';

export function VideoScreen() {
  const [verified, setVerified] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const playerRef = useRef<any>(null);

  const handleStateChange = useCallback(
    async (state: string) => {
      if (state === PLAYER_STATES.ENDED) {
        if (!playerRef.current || verified) return;
        try {
          const [duration, currentTime] = await Promise.all([
            playerRef.current.getDuration(),
            playerRef.current.getCurrentTime(),
          ]);
          const videoDurationSec = duration;
          const watchDurationSec = currentTime;
          const res = await verifyVideo(
            DEFAULT_USER_ID,
            videoDurationSec,
            watchDurationSec
          );
          if (res.valid && res.trigger_confetti) {
            setConfettiVisible(true);
          }
          setVerified(true);
        } catch {
          setVerified(true);
        }
      }
    },
    [verified]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Learn with Khan Academy</Text>
      <Text style={styles.hint}>
        Watch at least 90% to earn XP. No skipping!
      </Text>
      <YoutubeIframe
        ref={playerRef}
        height={220}
        play={false}
        videoId={KHAN_ACADEMY_VIDEO_ID}
        onChangeState={handleStateChange}
      />
      <ConfettiOverlay
        visible={confettiVisible}
        onComplete={() => setConfettiVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#faf8f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#5d4037',
    marginBottom: 16,
  },
});
