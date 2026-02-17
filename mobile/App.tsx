import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import YoutubePlayer, {
  PLAYER_STATES,
  YoutubeIframeRef,
} from 'react-native-youtube-iframe';
import {
  apiClient,
  GeneratedContentResponse,
  SessionStartResponse,
  SubjectTrack,
  SubmitProgressResponse,
} from './src/api/client';

const USER_ID = '550e8400-e29b-41d4-a716-446655440010';
const KHAN_VIDEO_ID = 'k6U-i4gXkLM';

function VisualTimer({
  timer,
  isExpired,
}: {
  timer: SessionStartResponse['session_timer'];
  isExpired: boolean;
}) {
  const steps = 20;
  const iconIndex = Math.max(
    0,
    Math.min(steps - 1, Math.floor(timer.progress_ratio * (steps - 1))),
  );
  const visualIcon = timer.visual_mode === 'puppy-walk' ? '🐶' : '🤸‍♀️';

  return (
    <View style={styles.timerCard}>
      <Text style={styles.sectionTitle}>Focus Timer</Text>
      <Text style={styles.timerCaption}>
        {isExpired
          ? 'Focus block complete. Pause to recharge for tomorrow.'
          : 'Stay in flow and move the story forward.'}
      </Text>
      <View style={styles.timerTrack}>
        {Array.from({ length: steps }).map((_, index) => (
          <Text key={`timer-step-${index}`} style={styles.timerStep}>
            {index === iconIndex ? visualIcon : '·'}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ConfettiOverlay({
  visible,
  opacity,
}: {
  visible: boolean;
  opacity: number;
}) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.confettiOverlay, { opacity }]}>
      <LottieView
        autoPlay
        loop={false}
        source={require('./assets/confetti.json')}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function App() {
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const watchStartRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const didSeekRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(1);
  const contentShownAtRef = useRef<number>(Date.now());

  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Start a focus session.');
  const [sessionData, setSessionData] = useState<SessionStartResponse | null>(null);
  const [currentContent, setCurrentContent] = useState<GeneratedContentResponse | null>(
    null,
  );
  const [answerDraft, setAnswerDraft] = useState('');
  const [lastProgress, setLastProgress] = useState<SubmitProgressResponse | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [confettiOpacity, setConfettiOpacity] = useState(1);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const gamificationState = lastProgress?.gamification?.state ?? null;
  const league = lastProgress?.gamification?.league ?? null;
  const quests = sessionData?.quests ?? [];
  const streakFire = useMemo(
    () => '🔥'.repeat(Math.min(5, gamificationState?.current_streak ?? 0)),
    [gamificationState?.current_streak],
  );

  const updateLocalTimer = useCallback(() => {
    setSessionData((previous) => {
      if (!previous) {
        return previous;
      }
      const startedAt = new Date(previous.session_timer.started_at).getTime();
      const expiresAt = new Date(previous.session_timer.expires_at).getTime();
      const ratio = Math.min(
        1,
        Math.max(0, (Date.now() - startedAt) / (expiresAt - startedAt)),
      );
      const expired = ratio >= 1;
      if (expired) {
        setSessionExpired(true);
      }
      return {
        ...previous,
        session_timer: {
          ...previous.session_timer,
          progress_ratio: ratio,
          is_expired: expired,
        },
      };
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(updateLocalTimer, 1000);
    return () => clearInterval(timer);
  }, [updateLocalTimer]);

  useEffect(() => {
    if (!videoPlaying) {
      return;
    }
    const polling = setInterval(() => {
      void (async () => {
        const player = playerRef.current;
        if (!player) {
          return;
        }
        const nowTime = await player.getCurrentTime();
        const delta = nowTime - lastTimestampRef.current;
        if (delta > 2.4) {
          didSeekRef.current = true;
        }
        lastTimestampRef.current = nowTime;
      })();
    }, 1000);
    return () => clearInterval(polling);
  }, [videoPlaying]);

  const startSession = useCallback(async () => {
    try {
      setIsBootstrapping(true);
      setStatusMessage('Starting focus session...');
      const started = await apiClient.startSession({
        user_id: USER_ID,
        focus_block_min: 15,
      });
      setSessionData(started);
      setSessionExpired(started.session_timer.is_expired);
      setStatusMessage('Session started. Generating first adaptive challenge...');
      const recommendedTrack = started.optimal_learning_path.recommended_track;
      const recommendedConcept =
        recommendedTrack === 'MATH'
          ? started.optimal_learning_path.math_next_concept.concept_id
          : started.optimal_learning_path.ela_next_concept.concept_id;
      const generated = await apiClient.generateContent({
        user_id: USER_ID,
        track: recommendedTrack,
        concept_id: recommendedConcept,
      });
      contentShownAtRef.current = Date.now();
      setCurrentContent(generated);
      setStatusMessage('New challenge ready.');
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  const requestNextChallenge = useCallback(async () => {
    if (!sessionData || sessionExpired) {
      return;
    }
    try {
      setIsLoadingContent(true);
      const track: SubjectTrack =
        currentContent?.track ??
        sessionData.optimal_learning_path.recommended_track;
      const conceptId =
        track === 'MATH'
          ? sessionData.optimal_learning_path.math_next_concept.concept_id
          : sessionData.optimal_learning_path.ela_next_concept.concept_id;
      const generated = await apiClient.generateContent({
        user_id: USER_ID,
        track,
        concept_id: conceptId,
      });
      contentShownAtRef.current = Date.now();
      setCurrentContent(generated);
      setAnswerDraft('');
      setStatusMessage('Next challenge generated.');
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsLoadingContent(false);
    }
  }, [currentContent?.track, sessionData, sessionExpired]);

  const submitProgress = useCallback(
    async (isCorrect: boolean) => {
      if (!currentContent || sessionExpired) {
        return;
      }
      try {
        const elapsed = Date.now() - contentShownAtRef.current;
        const progress = await apiClient.submitProgress({
          user_id: USER_ID,
          concept_id: currentContent.concept_id,
          track: currentContent.track,
          is_correct: isCorrect,
          learner_response: answerDraft,
          response_time_ms: elapsed,
        });
        setLastProgress(progress);
        if (progress.session_expired) {
          setSessionExpired(true);
          setStatusMessage(progress.zeigarnik_prompt ?? 'Session complete.');
          return;
        }
        if (progress.gamification?.flow_state.confetti_enabled) {
          setConfettiOpacity(progress.gamification.flow_state.confetti_opacity);
          setConfettiVisible(true);
          setTimeout(() => setConfettiVisible(false), 1600);
        }
        setStatusMessage(
          isCorrect
            ? 'Great work! Keep the story moving.'
            : progress.socratic_question ?? 'Try one smaller step and retry.',
        );
      } catch (error) {
        setStatusMessage((error as Error).message);
      }
    },
    [answerDraft, currentContent, sessionExpired],
  );

  const purchaseStreakFreeze = useCallback(async () => {
    try {
      const response = await apiClient.purchaseStreakFreeze({ user_id: USER_ID });
      if (response.purchased) {
        setStatusMessage('Streak Freeze purchased.');
      } else {
        setStatusMessage(`Need ${response.cost_xp} XP to buy Streak Freeze.`);
      }
      if (lastProgress?.gamification) {
        setLastProgress({
          ...lastProgress,
          gamification: {
            ...lastProgress.gamification,
            state: response.state,
          },
        });
      }
    } catch (error) {
      setStatusMessage((error as Error).message);
    }
  }, [lastProgress]);

  const onVideoStateChange = useCallback((state: PLAYER_STATES) => {
    if (state === PLAYER_STATES.PLAYING) {
      setVideoPlaying(true);
      void (async () => {
        if (!playerRef.current) {
          return;
        }
        const currentTime = await playerRef.current.getCurrentTime();
        if (watchStartRef.current === null) {
          watchStartRef.current = currentTime;
        }
        lastTimestampRef.current = currentTime;
      })();
      return;
    }

    if (state === PLAYER_STATES.ENDED) {
      setVideoPlaying(false);
      void (async () => {
        if (!playerRef.current) {
          return;
        }
        const endTime = await playerRef.current.getCurrentTime();
        const duration = await playerRef.current.getDuration();
        const watchDuration = Math.max(
          0,
          endTime - (watchStartRef.current ?? 0),
        );
        const verification = await apiClient.verifyVideo({
          user_id: USER_ID,
          video_id: KHAN_VIDEO_ID,
          watch_duration_sec: watchDuration,
          video_duration_sec: duration,
          playback_rate: playbackRateRef.current,
          did_seek: didSeekRef.current,
        });
        if (verification.should_trigger_confetti) {
          setConfettiOpacity(1);
          setConfettiVisible(true);
          setTimeout(() => setConfettiVisible(false), 1600);
        }
        setStatusMessage(verification.reason);
        watchStartRef.current = null;
        lastTimestampRef.current = 0;
        didSeekRef.current = false;
      })();
      return;
    }

    setVideoPlaying(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ConfettiOverlay visible={confettiVisible} opacity={confettiOpacity} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ashi Adaptive Learning</Text>
        <Text style={styles.subtitle}>
          Flow-state practice from confetti joy to curiosity joy.
        </Text>
        <Text style={styles.status}>{statusMessage}</Text>

        <Pressable style={styles.primaryButton} onPress={startSession}>
          {isBootstrapping ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Start Focus Session</Text>
          )}
        </Pressable>

        {sessionData ? (
          <VisualTimer
            timer={sessionData.session_timer}
            isExpired={sessionExpired || sessionData.session_timer.is_expired}
          />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quests</Text>
          {quests.map((quest) => (
            <Text key={quest.title} style={styles.bodyText}>
              • {quest.title}: {quest.objective}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Adaptive Challenge</Text>
          {currentContent ? (
            <>
              <Text style={styles.bodyTextStrong}>{currentContent.content.title}</Text>
              <Text style={styles.bodyText}>{currentContent.content.story_intro}</Text>
              <Text style={styles.promptText}>{currentContent.content.prompt}</Text>
              <Text style={styles.bodyText}>
                {currentContent.content.story_cliffhanger}
              </Text>
              <Text style={styles.hintText}>
                Answer format: {currentContent.content.expected_answer_format}
              </Text>
              <TextInput
                editable={!sessionExpired}
                value={answerDraft}
                onChangeText={setAnswerDraft}
                style={styles.input}
                placeholder="Type Ashi's answer draft..."
              />
              <View style={styles.row}>
                <Pressable
                  disabled={sessionExpired}
                  style={[styles.secondaryButton, sessionExpired && styles.disabledButton]}
                  onPress={() => submitProgress(true)}
                >
                  <Text style={styles.secondaryButtonText}>Mark Correct</Text>
                </Pressable>
                <Pressable
                  disabled={sessionExpired}
                  style={[styles.secondaryButton, sessionExpired && styles.disabledButton]}
                  onPress={() => submitProgress(false)}
                >
                  <Text style={styles.secondaryButtonText}>Need Socratic Hint</Text>
                </Pressable>
              </View>
              <Pressable
                disabled={sessionExpired || isLoadingContent}
                style={[styles.primaryButton, sessionExpired && styles.disabledButton]}
                onPress={requestNextChallenge}
              >
                {isLoadingContent ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Next Story Challenge</Text>
                )}
              </Pressable>
            </>
          ) : (
            <Text style={styles.bodyText}>
              Start a session to get an Ashi-themed adaptive prompt.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Streaks, Freeze, and League</Text>
          <Text style={styles.bodyText}>
            Daily streak: {gamificationState?.current_streak ?? 0} {streakFire}
          </Text>
          <Text style={styles.bodyText}>
            Streak freezes: {gamificationState?.streak_freezes ?? 0}
          </Text>
          <Text style={styles.bodyText}>Total XP: {gamificationState?.total_xp ?? 0}</Text>
          <Text style={styles.bodyText}>
            Current league: {gamificationState?.current_league ?? 'Bronze'}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={purchaseStreakFreeze}>
            <Text style={styles.secondaryButtonText}>Buy Streak Freeze</Text>
          </Pressable>
          {league ? (
            <View style={styles.leagueCard}>
              <Text style={styles.bodyText}>
                Rank {league.rank}/{league.cohort_size}
              </Text>
              <Text style={styles.bodyText}>
                Promotion zone: Top {league.promotion_zone}
              </Text>
              <Text style={styles.bodyText}>
                Demotion zone starts at rank {league.demotion_zone_start}
              </Text>
              {league.entries.slice(0, 5).map((entry) => (
                <Text key={entry.user_id} style={styles.smallText}>
                  #{entry.rank} {entry.display_name} - {entry.xp} XP
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Khan Video Verification</Text>
          <Text style={styles.bodyText}>
            Watch 90% at normal speed without seeking to earn XP.
          </Text>
          <YoutubePlayer
            ref={playerRef}
            height={220}
            videoId={KHAN_VIDEO_ID}
            onChangeState={onVideoStateChange}
            onPlaybackRateChange={(rateValue) => {
              const parsed = Number(rateValue);
              playbackRateRef.current = Number.isFinite(parsed) ? parsed : 1;
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 60,
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#334155',
  },
  status: {
    fontSize: 13,
    color: '#0f766e',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timerCard: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  timerCaption: {
    color: '#7c2d12',
    fontSize: 13,
  },
  timerTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerStep: {
    fontSize: 18,
    color: '#92400e',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  bodyText: {
    fontSize: 14,
    color: '#334155',
  },
  bodyTextStrong: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  promptText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.45,
  },
  leagueCard: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    gap: 4,
  },
  smallText: {
    fontSize: 12,
    color: '#475569',
  },
});
