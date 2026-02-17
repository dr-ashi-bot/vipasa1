import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { generateContent, startSession, submitProgress } from "./src/api/client";
import { ConfettiLayer } from "./src/components/ConfettiLayer";
import { LeagueCard } from "./src/components/LeagueCard";
import { QuestList } from "./src/components/QuestList";
import { StreakFireRow } from "./src/components/StreakFireRow";
import { VideoLessonCard } from "./src/components/VideoLessonCard";
import { VisualTimer } from "./src/components/VisualTimer";

interface SessionResponse {
  user_profile: {
    user_id: string;
    first_name: string;
    thematic_interests: string[];
  };
  session: {
    session_id: string;
    starts_at: string;
    expires_at: string;
    visual_theme: "puppy-walk" | "gymnast-routine";
  };
  optimal_learning_path: {
    recommended_track: "Math" | "ELA";
    math_concept: string;
    ela_concept: string;
  };
  gamification: {
    streak: number;
    streak_freezes: number;
    total_xp: number;
    flow_state: { confetti_opacity: number; confetti_frequency: number };
    league: {
      current_tier: string;
      rank_in_cohort: number;
      promotion_zone_max_rank: number;
      demotion_zone_min_rank: number;
    };
    quests: Array<{ title: string; target: string; reward_xp: number; expires_in_hours: number }>;
  };
}

interface ContentResponse {
  concept_id: string;
  track: "Math" | "ELA";
  content: {
    problem_markdown: string;
    expected_answer_format: string;
  };
}

interface SubmitResponse {
  xp_awarded: number;
  confetti: { trigger: boolean; opacity: number; frequency: number };
  socratic_feedback: string | null;
  mastery_update: { updated_probability: number };
}

export default function App() {
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [contentData, setContentData] = useState<ContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [answer, setAnswer] = useState("");
  const [xpTotal, setXpTotal] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [socraticQuestion, setSocraticQuestion] = useState<string | null>(null);
  const [confettiNonce, setConfettiNonce] = useState(0);
  const [confettiOpacity, setConfettiOpacity] = useState(1);

  const user = sessionData?.user_profile;
  const session = sessionData?.session;
  const plan = sessionData?.optimal_learning_path;
  const gamification = sessionData?.gamification;

  const currentTrack = useMemo(() => plan?.recommended_track ?? "Math", [plan?.recommended_track]);
  const currentConcept = useMemo(
    () => (currentTrack === "Math" ? plan?.math_concept : plan?.ela_concept),
    [currentTrack, plan?.ela_concept, plan?.math_concept],
  );

  const loadQuestion = useCallback(async () => {
    if (!user || !session || !currentConcept) return;
    const result = (await generateContent({
      user_id: user.user_id,
      session_id: session.session_id,
      concept_id: currentConcept,
      track: currentTrack,
    })) as ContentResponse;
    setContentData(result);
    setQuestionStartedAt(Date.now());
  }, [currentConcept, currentTrack, session, user]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await startSession()) as SessionResponse;
      setSessionData(response);
      setXpTotal(response.gamification.total_xp);
    } catch (error) {
      Alert.alert("Unable to start session", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (sessionData) {
      void loadQuestion();
    }
  }, [loadQuestion, sessionData]);

  const submitAnswer = async (isCorrect: boolean) => {
    if (!user || !session || !contentData || sessionLocked) {
      return;
    }
    const responseTimeSec = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));

    try {
      const response = (await submitProgress({
        user_id: user.user_id,
        session_id: session.session_id,
        concept_id: contentData.concept_id,
        track: contentData.track,
        is_correct: isCorrect,
        learner_response: answer,
        response_time_sec: responseTimeSec,
      })) as SubmitResponse;

      setXpTotal((value) => value + response.xp_awarded);
      setSocraticQuestion(response.socratic_feedback);
      setConfettiOpacity(response.confetti.opacity);
      const shouldShowConfetti =
        isCorrect && response.confetti.trigger && Math.random() <= response.confetti.frequency;
      if (shouldShowConfetti) {
        setConfettiNonce((value) => value + 1);
      }
      setAnswer("");
      await loadQuestion();
    } catch (error) {
      Alert.alert("Progress submission failed", (error as Error).message);
    }
  };

  if (loading || !sessionData || !session || !user || !plan || !gamification) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loading}>Launching Ashi's personalized flow session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ConfettiLayer playNonce={confettiNonce} opacity={confettiOpacity} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Hi {user.first_name}! Puppy + Gymnastics Learning Quest</Text>
        <Text style={styles.subHeader}>XP: {xpTotal}</Text>

        <VisualTimer
          startsAtIso={session.starts_at}
          expiresAtIso={session.expires_at}
          theme={session.visual_theme}
          onExpire={() => {
            setSessionLocked(true);
            setContentData(null);
          }}
        />

        <StreakFireRow streak={gamification.streak} streakFreezes={gamification.streak_freezes} />

        <LeagueCard
          tier={gamification.league.current_tier}
          rank={gamification.league.rank_in_cohort}
          promotionZoneMaxRank={gamification.league.promotion_zone_max_rank}
          demotionZoneMinRank={gamification.league.demotion_zone_min_rank}
        />

        <QuestList quests={gamification.quests} />

        <VideoLessonCard
          userId={user.user_id}
          videoId="LwCRRUa8yTU"
          onVerified={(result) => {
            if (result.verified) {
              setXpTotal((value) => value + result.xp_delta);
              setConfettiOpacity(result.opacity);
              setConfettiNonce((value) => value + 1);
            }
          }}
        />

        {sessionLocked ? (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedTitle}>Focus block complete for today.</Text>
            <Text style={styles.lockedBody}>
              The story pauses here on purpose so your brain wants to come back tomorrow.
            </Text>
          </View>
        ) : (
          <View style={styles.problemCard}>
            <Text style={styles.problemTitle}>
              {contentData?.track ?? currentTrack} Challenge: {contentData?.concept_id ?? currentConcept}
            </Text>
            <Text style={styles.problemBody}>{contentData?.content.problem_markdown}</Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              style={styles.input}
              placeholder={contentData?.content.expected_answer_format ?? "Type your answer"}
            />
            <View style={styles.buttonRow}>
              <Pressable style={[styles.button, styles.success]} onPress={() => void submitAnswer(true)}>
                <Text style={styles.buttonText}>I solved it</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.help]} onPress={() => void submitAnswer(false)}>
                <Text style={styles.buttonText}>I need a hint</Text>
              </Pressable>
            </View>
            {socraticQuestion ? (
              <View style={styles.socraticCard}>
                <Text style={styles.socraticTitle}>Socratic Question</Text>
                <Text style={styles.socraticBody}>{socraticQuestion}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  loading: {
    marginTop: 8,
    color: "#334155",
  },
  scroll: {
    padding: 14,
    paddingBottom: 32,
  },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  subHeader: {
    marginTop: 4,
    marginBottom: 10,
    color: "#374151",
  },
  lockedCard: {
    backgroundColor: "#e0e7ff",
    borderRadius: 12,
    padding: 14,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e1b4b",
  },
  lockedBody: {
    marginTop: 6,
    color: "#312e81",
  },
  problemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  problemBody: {
    marginTop: 8,
    color: "#374151",
    lineHeight: 20,
  },
  input: {
    marginTop: 10,
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  success: {
    backgroundColor: "#22c55e",
  },
  help: {
    backgroundColor: "#f59e0b",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  socraticCard: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    padding: 10,
  },
  socraticTitle: {
    fontWeight: "700",
    color: "#312e81",
  },
  socraticBody: {
    marginTop: 4,
    color: "#312e81",
  },
});
