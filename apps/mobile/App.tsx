import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { apiGet, apiPost } from './src/api';
import { getOrCreateUserId } from './src/storage';

type Track = 'math' | 'ela';

type StartSessionResponse = {
  session_id: string;
  user: {
    user_id: string;
    first_name: string;
    thematic_interests: string[];
    math_level: number;
    ela_level: number;
  };
  timer: { duration_sec: number; ends_at: string; visual: { type: string; total_steps: number } };
  next: { track: Track; concept_id: string };
};

type GeneratedContentResponse =
  | {
      session_complete?: false;
      content_id: string;
      track: Track;
      concept_id: string;
      story_part: string;
      question_text: string;
      input_mode: 'short_text' | 'multiple_choice';
      choices?: string[];
    }
  | { session_complete: true; message: string };

type SubmitProgressResponse = {
  is_correct: boolean;
  xp_delta: number;
  confetti: boolean;
  bkt: { concept_id: string; probability_known: number };
  socratic_question: string | null;
};

type GamificationStateResponse = {
  state: {
    user_id: string;
    current_streak: number;
    streak_freezes: number;
    total_xp: number;
    current_league: string;
    flow_state_level: number;
  };
  quests: {
    daily: { title: string; description: string };
    monthly: { title: string; description: string };
  };
  leaderboard: {
    week_id: string;
    tier: string;
    user_rank: number;
    promotion_zone: null | { start_rank: number; end_rank: number };
    demotion_zone: null | { start_rank: number; end_rank: number };
    entries: Array<{ rank: number; user_id: string; display_name: string; xp: number }>;
  };
};

const confettiSource = require('./assets/confetti.json');

function Button(props: { title: string; onPress: () => void; disabled?: boolean; tone?: 'primary' | 'soft' }) {
  const tone = props.tone ?? 'primary';
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[
        styles.btn,
        tone === 'primary' ? styles.btnPrimary : styles.btnSoft,
        props.disabled ? styles.btnDisabled : null,
      ]}
    >
      <Text style={tone === 'primary' ? styles.btnTextPrimary : styles.btnTextSoft}>{props.title}</Text>
    </Pressable>
  );
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'learn' | 'video' | 'done'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<StartSessionResponse | null>(null);
  const [content, setContent] = useState<GeneratedContentResponse | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<SubmitProgressResponse | null>(null);
  const [gami, setGami] = useState<GamificationStateResponse | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiOpacity = useMemo(() => {
    const lvl = gami?.state.flow_state_level ?? 0;
    return lvl >= 1 ? 0.25 : 1;
  }, [gami?.state.flow_state_level]);

  const endsAtMs = session ? new Date(session.timer.ends_at).getTime() : null;
  const timerProgress = useTimerProgress(endsAtMs, session?.timer.duration_sec ?? null);

  useEffect(() => {
    (async () => {
      const id = await getOrCreateUserId();
      setUserId(id);
    })();
  }, []);

  async function refreshGamification() {
    if (!userId) return;
    try {
      const resp = await apiGet<GamificationStateResponse>(`/api/gamification/state?user_id=${encodeURIComponent(userId)}`);
      setGami(resp);
    } catch (e) {
      // Non-fatal for learning loop
    }
  }

  async function startSession(track: Track) {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const s = await apiPost<StartSessionResponse>('/api/session/start', {
        user_id: userId,
        preferred_track: track,
        duration_sec: 1200,
      });
      setSession(s);
      setView('learn');
      setFeedback(null);
      setAnswer('');
      await refreshGamification();
      await loadContent(s.session_id, s.next.concept_id);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadContent(session_id: string, concept_id: string) {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const c = await apiPost<GeneratedContentResponse>('/api/content/generate', {
        user_id: userId,
        session_id,
        concept_id,
      });
      setContent(c);
      setFeedback(null);
      setAnswer('');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!userId || !session || !content || 'session_complete' in content) return;
    setError(null);
    setLoading(true);
    try {
      const resp = await apiPost<SubmitProgressResponse>('/api/progress/submit', {
        user_id: userId,
        session_id: session.session_id,
        content_id: content.content_id,
        concept_id: content.concept_id,
        is_correct: false,
        user_answer: answer,
        response_time_ms: 0,
      });
      setFeedback(resp);
      await refreshGamification();

      if (resp.is_correct && resp.confetti) {
        const lvl = gami?.state.flow_state_level ?? 0;
        const shouldShow = lvl >= 1 ? Math.random() < 0.35 : true;
        if (shouldShow) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 1200);
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.p}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {showConfetti ? (
        <View pointerEvents="none" style={[styles.confettiOverlay, { opacity: confettiOpacity }]}>
          <LottieView autoPlay loop={false} source={confettiSource} style={styles.confetti} />
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.h1}>VIPASA</Text>
        <Text style={styles.sub}>Ashi’s adaptive learning adventure</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {view === 'home' ? (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.h2}>Pick a focus track</Text>
            <Text style={styles.p}>Math stays challenging. Reading stays simple. The story stays cute.</Text>
            <View style={styles.row}>
              <Button title="Start Math Session" onPress={() => startSession('math')} disabled={loading} />
              <View style={{ width: 12 }} />
              <Button title="Start ELA Session" onPress={() => startSession('ela')} disabled={loading} tone="soft" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Streaks, leagues, quests</Text>
            <Button
              title="Refresh Progress"
              onPress={() => refreshGamification()}
              disabled={loading}
              tone="soft"
            />
            {gami ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.p}>Streak: {gami.state.current_streak} days</Text>
                <Text style={styles.p}>XP: {gami.state.total_xp} • League: {gami.state.current_league}</Text>
                <Text style={styles.p}>Daily quest: {gami.quests.daily.title}</Text>
                <Text style={styles.p}>Monthly quest: {gami.quests.monthly.title}</Text>
              </View>
            ) : (
              <Text style={styles.pMuted}>No progress yet (or backend not running).</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Video (Khan Academy)</Text>
            <Text style={styles.p}>Watch a video to earn XP (verified at 90%+ with no skipping).</Text>
            <Button title="Open Video Lesson" onPress={() => setView('video')} disabled={loading} />
          </View>
        </ScrollView>
      ) : null}

      {view === 'learn' && session ? (
        <ScrollView contentContainerStyle={styles.body}>
          <TimerVisual progress={timerProgress} />

          <View style={styles.card}>
            <View style={styles.rowSpace}>
              <Text style={styles.h2}>Story</Text>
              <Button title="Home" onPress={() => setView('home')} tone="soft" />
            </View>
            {'session_complete' in (content ?? {}) && (content as any).session_complete ? (
              <Text style={styles.p}>{(content as any).message}</Text>
            ) : content ? (
              <>
                <Text style={styles.p}>{(content as any).story_part}</Text>
                <Text style={styles.q}>{(content as any).question_text}</Text>

                {(content as any).input_mode === 'multiple_choice' ? (
                  <View style={{ marginTop: 10 }}>
                    {((content as any).choices ?? []).map((c: string) => (
                      <Pressable key={c} style={styles.choice} onPress={() => setAnswer(c)}>
                        <Text style={styles.choiceText}>{c}</Text>
                      </Pressable>
                    ))}
                    <Text style={styles.pMuted}>Selected: {answer || '—'}</Text>
                  </View>
                ) : (
                  <TextInput
                    value={answer}
                    onChangeText={setAnswer}
                    placeholder="Type your answer"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}

                <View style={styles.row}>
                  <Button title="Submit" onPress={submitAnswer} disabled={loading || !answer} />
                  <View style={{ width: 12 }} />
                  <Button
                    title="Next Problem"
                    onPress={() => loadContent(session.session_id, (content as any).concept_id)}
                    disabled={loading}
                    tone="soft"
                  />
                </View>

                {feedback ? (
                  <View style={styles.feedback}>
                    <Text style={feedback.is_correct ? styles.correct : styles.incorrect}>
                      {feedback.is_correct ? 'Correct!' : 'Not yet.'}
                    </Text>
                    {feedback.is_correct ? (
                      <Text style={styles.pMuted}>
                        Mastery now: {(feedback.bkt.probability_known * 100).toFixed(0)}%
                      </Text>
                    ) : feedback.socratic_question ? (
                      <Text style={styles.p}>{feedback.socratic_question}</Text>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.pMuted}>Start by generating a problem.</Text>
            )}
          </View>
        </ScrollView>
      ) : null}

      {view === 'video' ? (
        <VideoLesson
          userId={userId}
          onHome={() => setView('home')}
          onVerified={() => refreshGamification()}
          confettiOpacity={confettiOpacity}
          onConfetti={() => {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1200);
          }}
        />
      ) : null}

      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function useTimerProgress(endsAtMs: number | null, durationSec: number | null) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!endsAtMs || !durationSec) return;
    const startMs = endsAtMs - durationSec * 1000;
    const id = setInterval(() => {
      const now = Date.now();
      const p = Math.max(0, Math.min(1, (now - startMs) / (endsAtMs - startMs)));
      setProgress(p);
    }, 250);
    return () => clearInterval(id);
  }, [endsAtMs, durationSec]);
  return progress;
}

function TimerVisual(props: { progress: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: props.progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [props.progress, width]);

  const left = width.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

  return (
    <View style={styles.timerCard}>
      <Text style={styles.timerLabel}>Focus time</Text>
      <View style={styles.timerTrack}>
        <Animated.View style={[styles.puppyDot, { left }]} />
      </View>
      <Text style={styles.pMuted}>A puppy walks across the screen. No ticking numbers.</Text>
    </View>
  );
}

function VideoLesson(props: {
  userId: string;
  onHome: () => void;
  onVerified: () => void;
  onConfetti: () => void;
  confettiOpacity: number;
}) {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [videoId, setVideoId] = useState(''); // user can paste a Khan Academy YouTube id
  const [playing, setPlaying] = useState(false);
  const [watchedSec, setWatchedSec] = useState(0);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(false);
  const lastTimeRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);
  const [result, setResult] = useState<{ verified: boolean; xp_delta: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(async () => {
      try {
        const t = await playerRef.current?.getCurrentTime();
        const d = await playerRef.current?.getDuration();
        if (typeof d === 'number' && d > 0) setDurationSec(d);
        if (typeof t !== 'number') return;
        const delta = t - lastTimeRef.current;
        if (delta > 1.6) setSkipped(true);
        if (delta >= 0 && delta <= 1.6) setWatchedSec((w) => w + delta);
        lastTimeRef.current = t;
      } catch {
        // ignore
      }
    }, 600);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [playing]);

  async function verify() {
    setErr(null);
    setResult(null);
    if (!videoId) {
      setErr('Paste a YouTube video id (Khan Academy).');
      return;
    }
    if (!durationSec) {
      setErr('Play the video so we can read its duration.');
      return;
    }
    try {
      const resp = await apiPost<{ verified: boolean; xp_delta: number; confetti: boolean }>(
        '/api/video/verify',
        {
          user_id: props.userId,
          video_id: videoId,
          watch_duration_sec: Math.floor(watchedSec),
          video_duration_sec: Math.floor(durationSec),
          playback_rate: 1,
          skipped,
        },
      );
      setResult({ verified: resp.verified, xp_delta: resp.xp_delta });
      props.onVerified();
      if (resp.verified && resp.confetti) props.onConfetti();
    } catch (e) {
      setErr(String(e));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.card}>
        <View style={styles.rowSpace}>
          <Text style={styles.h2}>Video lesson</Text>
          <Button title="Home" onPress={props.onHome} tone="soft" />
        </View>
        <Text style={styles.p}>
          Anti-cheat: we only count watch time while playing, and we mark skipping if time jumps.
        </Text>
        <TextInput
          value={videoId}
          onChangeText={setVideoId}
          placeholder="YouTube video id (e.g., Khan Academy)"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {videoId ? (
          <View style={styles.videoWrap}>
            <YoutubePlayer
              ref={playerRef}
              height={Platform.OS === 'web' ? 360 : 240}
              play={playing}
              videoId={videoId}
              onChangeState={(s: string) => {
                if (s === 'playing') setPlaying(true);
                if (s === 'paused' || s === 'ended') setPlaying(false);
              }}
            />
          </View>
        ) : null}

        <View style={styles.row}>
          <Button title={playing ? 'Pause' : 'Play'} onPress={() => setPlaying((p) => !p)} tone="soft" />
          <View style={{ width: 12 }} />
          <Button title="Verify & Earn XP" onPress={verify} />
        </View>

        <Text style={styles.pMuted}>
          Watched: {Math.floor(watchedSec)}s / {durationSec ? Math.floor(durationSec) : '—'}s • Skipped:{' '}
          {skipped ? 'yes' : 'no'}
        </Text>
        {err ? <Text style={styles.errorText}>{err}</Text> : null}
        {result ? (
          <Text style={result.verified ? styles.correct : styles.incorrect}>
            {result.verified ? `Verified! +${result.xp_delta} XP` : 'Not verified yet (need 90%+ at normal speed, no skipping).'}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7FB' },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
  h1: { fontSize: 28, fontWeight: '800', color: '#2B2B2B' },
  sub: { marginTop: 2, color: '#6B6B6B' },
  body: { padding: 18, gap: 14, paddingBottom: 60 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E6F2',
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6F2FF',
  },
  timerLabel: { fontWeight: '800', marginBottom: 10, color: '#2B2B2B' },
  timerTrack: {
    height: 16,
    backgroundColor: '#F2F9FF',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  puppyDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: 'absolute',
    top: -1,
    backgroundColor: '#FFB3D5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  h2: { fontSize: 18, fontWeight: '800', color: '#2B2B2B' },
  p: { marginTop: 8, color: '#3A3A3A', lineHeight: 20 },
  pMuted: { marginTop: 8, color: '#808080' },
  q: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#1F1F1F', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  rowSpace: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, flex: 1, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#7C4DFF' },
  btnSoft: { backgroundColor: '#F3EDFF' },
  btnDisabled: { opacity: 0.6 },
  btnTextPrimary: { color: '#FFFFFF', fontWeight: '800' },
  btnTextSoft: { color: '#4B2FA7', fontWeight: '800' },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8DFF0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFDFE',
  },
  choice: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8DFF0',
    borderRadius: 12,
    backgroundColor: '#FFFDFE',
    marginBottom: 10,
  },
  choiceText: { color: '#2B2B2B', fontWeight: '700' },
  feedback: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAFF',
    borderWidth: 1,
    borderColor: '#EEE8FF',
  },
  correct: { color: '#1B8C3A', fontWeight: '900', fontSize: 16 },
  incorrect: { color: '#C23838', fontWeight: '900', fontSize: 16 },
  errorBox: { marginHorizontal: 18, padding: 10, borderRadius: 12, backgroundColor: '#FFECEC' },
  errorText: { color: '#9F1D1D' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  confetti: { width: '100%', height: '100%' },
  videoWrap: { marginTop: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000000' },
});
