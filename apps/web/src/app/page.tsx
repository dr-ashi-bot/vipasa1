"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type Track = "Math" | "ELA";

interface GamificationSnapshot {
  streak: number;
  streak_freezes: number;
  total_xp: number;
  flow_state?: { confetti_opacity: number; confetti_frequency: number };
  league: {
    current_tier: string;
    rank_in_cohort: number;
    promotion_zone_max_rank: number;
    demotion_zone_min_rank: number;
  };
  quests: Array<{ title: string; target: string; reward_xp: number }>;
}

interface SessionPayload {
  user_profile: { user_id: string; first_name: string; thematic_interests: string[] };
  session: {
    session_id: string;
    starts_at: string;
    expires_at: string;
    visual_theme: "puppy-walk" | "gymnast-routine";
  };
  optimal_learning_path: {
    recommended_track: Track;
    math_concept: string;
    ela_concept: string;
    reason: string;
  };
  gamification: GamificationSnapshot;
}

interface ContentPayload {
  concept_id: string;
  track: Track;
  content: {
    problem_markdown: string;
    expected_answer_format: string;
    curiosity_teaser: string;
    correct_answer: string;
  };
}

interface ProgressPayload {
  xp_awarded: number;
  confetti: { trigger: boolean; opacity: number; frequency: number };
  socratic_feedback: string | null;
  gamification: GamificationSnapshot;
}

interface VideoVerifyPayload {
  verified: boolean;
  xp_delta: number;
  reason: string;
  confetti: { trigger: boolean; opacity: number; frequency: number };
  gamification: GamificationSnapshot;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        container: string | HTMLElement,
        options: {
          width?: string;
          height?: string;
          videoId: string;
          events: {
            onReady: (event: { target: YouTubePlayer }) => void;
            onStateChange: (event: { data: number }) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaybackRate: () => number;
  destroy: () => void;
}

async function postJson<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as T;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^\w\s]/g, "");
}

export default function Home(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [sessionData, setSessionData] = useState<SessionPayload | null>(null);
  const [gamification, setGamification] = useState<GamificationSnapshot | null>(null);
  const [contentData, setContentData] = useState<ContentPayload | null>(null);
  const [answer, setAnswer] = useState("");
  const [socraticQuestion, setSocraticQuestion] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [confettiBurst, setConfettiBurst] = useState(0);
  const [confettiOpacity, setConfettiOpacity] = useState(1);
  const [videoMessage, setVideoMessage] = useState("Watch the video to unlock XP.");
  const [seekEvents, setSeekEvents] = useState(0);

  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef(0);
  const maxWatchTimeRef = useRef(0);
  const playbackRatesRef = useRef<number[]>([]);
  const videoDurationRef = useRef(1);
  const videoReadyRef = useRef(false);

  const currentTrack = sessionData?.optimal_learning_path.recommended_track ?? "Math";
  const currentConcept =
    currentTrack === "Math"
      ? sessionData?.optimal_learning_path.math_concept
      : sessionData?.optimal_learning_path.ela_concept;

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, idx) => ({
        id: `${confettiBurst}-${idx}`,
        left: `${(idx * 13) % 100}%`,
        delay: `${(idx % 7) * 90}ms`,
      })),
    [confettiBurst],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const session = await postJson<SessionPayload>("/api/session/start", {});
        setSessionData(session);
        setGamification(session.gamification);
      } catch (bootError) {
        setError((bootError as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, []);

  useEffect(() => {
    const loadQuestion = async () => {
      if (!sessionData || !currentConcept) return;
      try {
        const generated = await postJson<ContentPayload>("/api/content/generate", {
          user_id: sessionData.user_profile.user_id,
          session_id: sessionData.session.session_id,
          concept_id: currentConcept,
          track: currentTrack,
        });
        setContentData(generated);
        setQuestionStart(Date.now());
      } catch (contentError) {
        setError((contentError as Error).message);
      }
    };
    void loadQuestion();
  }, [currentConcept, currentTrack, sessionData]);

  useEffect(() => {
    if (!sessionData) return;
    const starts = Date.parse(sessionData.session.starts_at);
    const expires = Date.parse(sessionData.session.expires_at);
    const total = Math.max(1, expires - starts);
    const timer = setInterval(() => {
      const elapsed = Date.now() - starts;
      const progress = Math.min(1, Math.max(0, elapsed / total));
      setTimerProgress(progress);
      if (Date.now() >= expires) {
        setSessionExpired(true);
        setContentData(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionData]);

  useEffect(() => {
    let cancelled = false;
    const ensureYoutubeApi = async () => {
      if (typeof window === "undefined") return;
      if (window.YT?.Player) return;
      await new Promise<void>((resolve) => {
        const existing = document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]',
        );
        if (!existing) {
          const script = document.createElement("script");
          script.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(script);
        }
        const previousReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          previousReady?.();
          resolve();
        };
      });
    };

    const mountPlayer = async () => {
      await ensureYoutubeApi();
      if (cancelled || !playerHostRef.current || !window.YT?.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(playerHostRef.current, {
        width: "100%",
        height: "240",
        videoId: "LwCRRUa8yTU",
        events: {
          onReady: (event) => {
            videoReadyRef.current = true;
            videoDurationRef.current = Math.max(1, event.target.getDuration());
          },
          onStateChange: (event) => {
            const state = event.data;
            const YT = window.YT;
            if (!YT) return;
            if (state === YT.PlayerState.PLAYING) {
              if (playerPollRef.current) clearInterval(playerPollRef.current);
              playerPollRef.current = setInterval(() => {
                const player = playerRef.current;
                if (!player) return;
                const current = player.getCurrentTime();
                const delta = current - lastTimeRef.current;
                if (delta > 4.5) {
                  setSeekEvents((value) => value + 1);
                }
                lastTimeRef.current = current;
                maxWatchTimeRef.current = Math.max(maxWatchTimeRef.current, current);
                playbackRatesRef.current.push(player.getPlaybackRate());
              }, 1000);
              return;
            }

            if (
              state === YT.PlayerState.PAUSED ||
              state === YT.PlayerState.BUFFERING ||
              state === YT.PlayerState.ENDED
            ) {
              if (playerPollRef.current) clearInterval(playerPollRef.current);
            }

            if (state === YT.PlayerState.ENDED) {
              void verifyVideoWatch();
            }
          },
        },
      });
    };

    void mountPlayer();
    return () => {
      cancelled = true;
      if (playerPollRef.current) clearInterval(playerPollRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const handleProgressSubmit = async (forceIncorrect = false) => {
    if (!sessionData || !contentData || sessionExpired) return;
    setBusy(true);
    setError("");

    const expected = normalizeText(contentData.content.correct_answer);
    const provided = normalizeText(answer);
    const checkedCorrect = !forceIncorrect && expected.length > 0 && provided.includes(expected);
    const responseTime = Math.max(1, Math.round((Date.now() - questionStart) / 1000));

    try {
      const progress = await postJson<ProgressPayload>("/api/progress/submit", {
        user_id: sessionData.user_profile.user_id,
        session_id: sessionData.session.session_id,
        concept_id: contentData.concept_id,
        track: contentData.track,
        is_correct: checkedCorrect,
        learner_response: answer,
        response_time_sec: responseTime,
      });
      setGamification(progress.gamification);
      setSocraticQuestion(progress.socratic_feedback);
      setConfettiOpacity(progress.confetti.opacity);

      if (progress.confetti.trigger && Math.random() <= progress.confetti.frequency) {
        setConfettiBurst((value) => value + 1);
      }

      if (sessionData && currentConcept) {
        const nextContent = await postJson<ContentPayload>("/api/content/generate", {
          user_id: sessionData.user_profile.user_id,
          session_id: sessionData.session.session_id,
          concept_id: currentConcept,
          track: currentTrack,
        });
        setContentData(nextContent);
        setQuestionStart(Date.now());
      }
      setAnswer("");
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verifyVideoWatch = async () => {
    if (!sessionData || !videoReadyRef.current) return;
    const playbackRates = playbackRatesRef.current;
    const avgRate =
      playbackRates.length > 0
        ? playbackRates.reduce((sum, value) => sum + value, 0) / playbackRates.length
        : 1;

    try {
      const result = await postJson<VideoVerifyPayload>("/api/video/verify", {
        user_id: sessionData.user_profile.user_id,
        video_id: "LwCRRUa8yTU",
        watch_duration_sec: maxWatchTimeRef.current,
        video_duration_sec: videoDurationRef.current,
        playback_rate_avg: avgRate,
        seek_events: seekEvents,
      });
      setGamification(result.gamification);
      setVideoMessage(
        result.verified
          ? `Video verified! +${result.xp_delta} XP earned.`
          : `Video not verified: ${result.reason}`,
      );
      setConfettiOpacity(result.confetti.opacity);
      if (result.confetti.trigger && Math.random() <= result.confetti.frequency) {
        setConfettiBurst((value) => value + 1);
      }
    } catch (videoError) {
      setVideoMessage(`Verification failed: ${(videoError as Error).message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <p>Launching Ashi&apos;s adaptive learning flow...</p>
      </div>
    );
  }

  if (!sessionData || !gamification) {
    return (
      <div className={styles.centered}>
        <h1>Unable to initialize session</h1>
        <p>{error || "Please refresh to retry."}</p>
      </div>
    );
  }

  const icon = sessionData.session.visual_theme === "puppy-walk" ? "🐶" : "🤸";

  return (
    <div className={styles.page}>
      {confettiBurst > 0 ? (
        <div className={styles.confettiLayer} style={{ opacity: confettiOpacity }}>
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className={styles.confettiPiece}
              style={{ left: piece.left, animationDelay: piece.delay }}
            >
              🎉
            </span>
          ))}
        </div>
      ) : null}

      <main className={styles.main}>
        <h1 className={styles.title}>VIPASA Flow Learning Web</h1>
        <p className={styles.subtitle}>
          Welcome {sessionData.user_profile.first_name}. Today&apos;s story blends gymnastics and cute puppies.
        </p>

        <section className={styles.card}>
          <h2>Visual Focus Timer</h2>
          <p>No countdown numbers shown, only calm visual progress.</p>
          <div className={styles.timerTrack}>
            <div className={styles.timerFill} style={{ width: `${Math.max(8, timerProgress * 100)}%` }} />
            <span className={styles.timerIcon} style={{ left: `${Math.min(92, timerProgress * 92)}%` }}>
              {icon}
            </span>
          </div>
          {sessionExpired ? (
            <p className={styles.expired}>
              Focus block complete. New content is paused to preserve tomorrow&apos;s curiosity.
            </p>
          ) : (
            <p className={styles.reason}>{sessionData.optimal_learning_path.reason}</p>
          )}
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>Streak + XP</h2>
            <p>Streak: {gamification.streak} days</p>
            <p>Streak Freeze: {gamification.streak_freezes}</p>
            <p>Total XP: {gamification.total_xp}</p>
            <p className={styles.fire}>{Array.from({ length: Math.max(1, Math.min(7, gamification.streak)) }, () => "🔥").join(" ")}</p>
          </article>

          <article className={styles.card}>
            <h2>League</h2>
            <p>Tier: {gamification.league.current_tier}</p>
            <p>Rank: {gamification.league.rank_in_cohort}/30</p>
            <p>Promotion: top {gamification.league.promotion_zone_max_rank}</p>
            <p>Demotion: bottom 5 (26-30)</p>
            <p className={styles.tiers}>
              Bronze • Silver • Gold • Sapphire • Ruby • Emerald • Amethyst • Pearl • Obsidian • Diamond
            </p>
          </article>
        </section>

        <section className={styles.card}>
          <h2>Quests</h2>
          <ul className={styles.questList}>
            {gamification.quests.map((quest) => (
              <li key={quest.title}>
                <strong>{quest.title}:</strong> {quest.target} (+{quest.reward_xp} XP)
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card}>
          <h2>Adaptive Challenge</h2>
          <p>
            Track: <strong>{contentData?.track ?? currentTrack}</strong> | Concept:{" "}
            <strong>{contentData?.concept_id ?? currentConcept}</strong>
          </p>
          <pre className={styles.problem}>{contentData?.content.problem_markdown}</pre>

          {!sessionExpired ? (
            <>
              <input
                className={styles.input}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={contentData?.content.expected_answer_format ?? "Type your response"}
              />
              <div className={styles.buttons}>
                <button disabled={busy} onClick={() => void handleProgressSubmit(false)}>
                  Check my answer
                </button>
                <button disabled={busy} onClick={() => void handleProgressSubmit(true)}>
                  I need a Socratic hint
                </button>
              </div>
            </>
          ) : null}
          {socraticQuestion ? <p className={styles.socratic}>Socratic question: {socraticQuestion}</p> : null}
        </section>

        <section className={styles.card}>
          <h2>Khan-Style Video Verification</h2>
          <p>
            XP is awarded only when watched at least 90% at normal speed and with no skipping.
          </p>
          <div ref={playerHostRef} className={styles.videoHost} />
          <div className={styles.buttons}>
            <button onClick={() => void verifyVideoWatch()}>Verify watched progress now</button>
          </div>
          <p className={styles.videoMessage}>{videoMessage}</p>
          <p className={styles.videoMeta}>Detected seek events: {seekEvents}</p>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
