import { randomUUID } from "node:crypto";
import { store } from "./state";
import {
  ELA_CONCEPTS,
  LEAGUE_TIERS,
  MATH_CONCEPTS,
  type BktMastery,
  type GamificationState,
  type LeagueTier,
  type SessionState,
  type SubjectTrack,
  type UserProfile,
} from "./types";

function clampProbability(value: number): number {
  if (Number.isNaN(value)) return 0.25;
  return Math.min(1, Math.max(0, value));
}

function masteryKey(userId: string, track: SubjectTrack, conceptId: string): string {
  return `${userId}:${track}:${conceptId}`;
}

function getOrCreateUser(userId?: string): UserProfile {
  if (userId && store.userProfiles.has(userId)) {
    return store.userProfiles.get(userId)!;
  }

  const profile: UserProfile = {
    user_id: userId ?? randomUUID(),
    first_name: "Ashi",
    thematic_interests: ["gymnastics", "cute puppies"],
    math_level: 6,
    ela_level: 4,
  };
  store.userProfiles.set(profile.user_id, profile);
  return profile;
}

function getOrCreateGamification(userId: string): GamificationState {
  const existing = store.gamification.get(userId);
  if (existing) {
    return existing;
  }

  const state: GamificationState = {
    user_id: userId,
    current_streak: 0,
    streak_freezes: 1,
    total_xp: 0,
    current_league: "Bronze",
    weekly_xp: 0,
    weekly_rank: 30,
    quick_correct_streak: 0,
    confetti_opacity: 1,
    confetti_frequency: 1,
    last_active_on: "",
  };
  store.gamification.set(userId, state);
  return state;
}

function getOrCreateMastery(userId: string, track: SubjectTrack, conceptId: string): BktMastery {
  const key = masteryKey(userId, track, conceptId);
  const existing = store.mastery.get(key);
  if (existing) return existing;

  const row: BktMastery = {
    mastery_id: randomUUID(),
    user_id: userId,
    concept_id: conceptId,
    track,
    probability_known: 0.25,
    slip: 0.1,
    guess: 0.2,
    transition: 0.15,
    updated_at: new Date().toISOString(),
  };
  store.mastery.set(key, row);
  return row;
}

function applyBktEvidence(prior: number, slip: number, guess: number, isCorrect: boolean): number {
  if (isCorrect) {
    const numerator = prior * (1 - slip);
    const denominator = numerator + (1 - prior) * guess;
    return clampProbability(numerator / denominator);
  }

  const numerator = prior * slip;
  const denominator = numerator + (1 - prior) * (1 - guess);
  return clampProbability(numerator / denominator);
}

function updateDailyStreak(gamification: GamificationState, submittedAtIso: string): void {
  const date = submittedAtIso.slice(0, 10);
  if (!gamification.last_active_on) {
    gamification.current_streak = 1;
    gamification.last_active_on = date;
    return;
  }

  if (gamification.last_active_on === date) {
    return;
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const delta = Math.floor(
    (Date.parse(date) - Date.parse(gamification.last_active_on)) / oneDay,
  );
  if (delta === 1) {
    gamification.current_streak += 1;
  } else if (delta > 1) {
    if (gamification.streak_freezes > 0) {
      gamification.streak_freezes -= 1;
    } else {
      gamification.current_streak = 1;
    }
  }
  gamification.last_active_on = date;
}

function pickLeague(weeklyXp: number): LeagueTier {
  if (weeklyXp >= 1800) return "Diamond";
  if (weeklyXp >= 1500) return "Obsidian";
  if (weeklyXp >= 1250) return "Pearl";
  if (weeklyXp >= 1050) return "Amethyst";
  if (weeklyXp >= 850) return "Emerald";
  if (weeklyXp >= 680) return "Ruby";
  if (weeklyXp >= 520) return "Sapphire";
  if (weeklyXp >= 360) return "Gold";
  if (weeklyXp >= 220) return "Silver";
  return "Bronze";
}

function leagueSnapshot(state: GamificationState): {
  current_tier: LeagueTier;
  rank_in_cohort: number;
  cohort_size: 30;
  promotion_zone_max_rank: number;
  demotion_zone_min_rank: number;
} {
  const tierIndex = LEAGUE_TIERS.indexOf(state.current_league);
  const promotion_zone_max_rank = tierIndex <= 2 ? 15 : tierIndex <= 5 ? 12 : 10;
  return {
    current_tier: state.current_league,
    rank_in_cohort: state.weekly_rank,
    cohort_size: 30,
    promotion_zone_max_rank,
    demotion_zone_min_rank: 26,
  };
}

function quests(): Array<{
  title: string;
  target: string;
  reward_xp: number;
  expires_in_hours: number;
}> {
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());
  return [
    {
      title: "Quick Sprint",
      target: "Solve 5 problems in 3 mins",
      reward_xp: 60,
      expires_in_hours: 24,
    },
    {
      title: `${month} Quest`,
      target: "Complete 40 focused learning challenges",
      reward_xp: 600,
      expires_in_hours: 24 * 30,
    },
  ];
}

function selectLeastMastered(userId: string, track: SubjectTrack, concepts: readonly string[]): string {
  let selected = concepts[0];
  let lowest = Number.POSITIVE_INFINITY;
  for (const concept of concepts) {
    const mastery = getOrCreateMastery(userId, track, concept);
    if (mastery.probability_known < lowest) {
      lowest = mastery.probability_known;
      selected = concept;
    }
  }
  return selected;
}

function assertSessionActive(sessionId: string): SessionState {
  const session = store.sessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found. Start a new focus block.");
  }
  if (Date.now() >= Date.parse(session.expires_at)) {
    throw new Error(
      "Session ended to preserve focus stamina. Return tomorrow to unlock the next story chapter.",
    );
  }
  return session;
}

function createMathChallenge(conceptId: string): {
  prompt: string;
  answer: string;
  format: string;
  teaser: string;
} {
  if (conceptId === "math_6_integer_operations") {
    const a = -8;
    const b = 13;
    return {
      prompt:
        "Ashi and two cute puppies found cards with -8 and +13 while practicing beam turns. Combine both integers to unlock the next clue.",
      answer: String(a + b),
      format: "Write one integer",
      teaser: "Solve this to reveal which balance-beam move opens the puppy treasure door.",
    };
  }

  if (conceptId === "math_6_multi_step_equations") {
    return {
      prompt:
        "Ashi scores points in a gymnastics puzzle: 3x + 5 = 20. Solve for x so the puppies can open part 2 of the map.",
      answer: "5",
      format: "Write one integer for x",
      teaser: "Part 2 reveals a mystery shape hidden under the puppy podium.",
    };
  }

  return {
    prompt:
      "Ashi stacks toy boxes shaped like a rectangular prism: length 4, width 3, height 2. What is the volume in cubic units?",
    answer: "24",
    format: "Write one integer",
    teaser: "The next clue explains why one puppy guards the prism vault.",
  };
}

function createElaChallenge(conceptId: string): {
  prompt: string;
  answer: string;
  format: string;
  teaser: string;
} {
  if (conceptId === "ela_4_sentence_fluency") {
    return {
      prompt:
        "Read this line: \"Ashi flips. The puppy claps. The crowd smiles.\" Rewrite it as one smooth sentence.",
      answer: "Ashi flips, the puppy claps, and the crowd smiles.",
      format: "Write one clear sentence",
      teaser: "Your sentence unlocks the puppy's next camp message.",
    };
  }

  if (conceptId === "ela_4_decodable_words") {
    return {
      prompt:
        "Pick the word with short vowel sound in this set: pup, pine, cute, rope. Explain your choice in one short sentence.",
      answer: "pup",
      format: "Write one short sentence that includes the word",
      teaser: "Part 2 reveals the puppy badge Ashi earns next.",
    };
  }

  return {
    prompt:
      "Read this: \"When Ashi landed her cartwheel, the puppy wagged and the team cheered.\" What is the main idea?",
    answer: "Ashi did a good cartwheel and everyone was happy.",
    format: "Write one short sentence",
    teaser: "Solve to discover why the puppy is holding a tiny medal.",
  };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^\w\s]/g, "");
}

function determineCorrectness(
  explicitFlag: boolean,
  learnerResponse: string | undefined,
  expected: string | undefined,
): boolean {
  if (!expected || !learnerResponse) {
    return explicitFlag;
  }

  const expectedNorm = normalizeText(expected);
  const responseNorm = normalizeText(learnerResponse);
  if (!expectedNorm || !responseNorm) {
    return explicitFlag;
  }

  if (responseNorm === expectedNorm) {
    return true;
  }
  if (responseNorm.includes(expectedNorm)) {
    return true;
  }
  return false;
}

function buildSocraticQuestion(track: SubjectTrack, conceptId: string, misconceptionCount: number): string {
  if (track === "Math") {
    if (conceptId === "math_6_multi_step_equations") {
      return "Ashi, what inverse operation should you do first to undo the +5 before solving for x?";
    }
    if (conceptId === "math_6_integer_operations") {
      return "Ashi, when adding a negative and a positive integer, which number has the larger absolute value?";
    }
    return "Ashi, what part of the 3D shape formula can you break into a smaller step first?";
  }

  if (misconceptionCount > 1) {
    return "Ashi, which exact words in the sentence prove the main idea this time?";
  }
  return "Ashi, can you find one key word that tells what happened most in this sentence?";
}

export function startSession(input: {
  user_id?: string;
  preferred_visual_theme?: "puppy-walk" | "gymnast-routine";
}): {
  user_profile: UserProfile;
  session: SessionState;
  visual_timer: { style: "puppy-walk" | "gymnast-routine"; uses_numeric_countdown: false };
  optimal_learning_path: {
    recommended_track: SubjectTrack;
    math_concept: string;
    ela_concept: string;
    reason: string;
  };
  gamification: {
    streak: number;
    streak_freezes: number;
    total_xp: number;
    flow_state: { confetti_opacity: number; confetti_frequency: number };
    league: ReturnType<typeof leagueSnapshot>;
    quests: ReturnType<typeof quests>;
  };
} {
  const user = getOrCreateUser(input.user_id);
  const duration_minutes = 18;
  const now = Date.now();
  const session: SessionState = {
    session_id: randomUUID(),
    user_id: user.user_id,
    starts_at: new Date(now).toISOString(),
    expires_at: new Date(now + duration_minutes * 60_000).toISOString(),
    duration_minutes,
    visual_theme: input.preferred_visual_theme ?? "puppy-walk",
  };
  store.sessions.set(session.session_id, session);

  const mathConcept = selectLeastMastered(user.user_id, "Math", MATH_CONCEPTS);
  const elaConcept = selectLeastMastered(user.user_id, "ELA", ELA_CONCEPTS);
  const mathProb = getOrCreateMastery(user.user_id, "Math", mathConcept).probability_known;
  const elaProb = getOrCreateMastery(user.user_id, "ELA", elaConcept).probability_known;
  const recommended_track: SubjectTrack = mathProb <= elaProb ? "Math" : "ELA";
  const gamification = getOrCreateGamification(user.user_id);

  return {
    user_profile: user,
    session,
    visual_timer: {
      style: session.visual_theme,
      uses_numeric_countdown: false,
    },
    optimal_learning_path: {
      recommended_track,
      math_concept: mathConcept,
      ela_concept: elaConcept,
      reason:
        recommended_track === "Math"
          ? "Math challenge is best for growth while reading load stays manageable."
          : "ELA boost is prioritized while keeping confidence and momentum strong.",
    },
    gamification: {
      streak: gamification.current_streak,
      streak_freezes: gamification.streak_freezes,
      total_xp: gamification.total_xp,
      flow_state: {
        confetti_opacity: gamification.confetti_opacity,
        confetti_frequency: gamification.confetti_frequency,
      },
      league: leagueSnapshot(gamification),
      quests: quests(),
    },
  };
}

export function generateContent(input: {
  user_id: string;
  concept_id: string;
  track: SubjectTrack;
  session_id: string;
}): {
  user_id: string;
  concept_id: string;
  track: SubjectTrack;
  content: {
    problem_markdown: string;
    expected_answer_format: string;
    curiosity_teaser: string;
    correct_answer: string;
  };
  constraints: {
    math_level_target: 6;
    ela_level_target: 4;
    persona_injection: { user_name: string; interests: string[] };
  };
} {
  assertSessionActive(input.session_id);
  const user = store.userProfiles.get(input.user_id);
  if (!user) {
    throw new Error("User not found.");
  }

  const challenge =
    input.track === "Math"
      ? createMathChallenge(input.concept_id)
      : createElaChallenge(input.concept_id);
  store.answerKey.set(`${input.session_id}:${input.concept_id}`, challenge.answer);
  store.memories.unshift({
    id: randomUUID(),
    user_id: input.user_id,
    concept_id: input.concept_id,
    kind: "content",
    text: `Generated ${input.track} content for ${input.concept_id}.`,
    created_at: new Date().toISOString(),
  });

  return {
    user_id: user.user_id,
    concept_id: input.concept_id,
    track: input.track,
    content: {
      problem_markdown: `### Story\n${user.first_name} is in a gymnastics mission with cute puppies.\n\n### Challenge\n${challenge.prompt}\n\n### Next Story Step\n${challenge.teaser}`,
      expected_answer_format: challenge.format,
      curiosity_teaser: challenge.teaser,
      correct_answer: challenge.answer,
    },
    constraints: {
      math_level_target: 6,
      ela_level_target: 4,
      persona_injection: {
        user_name: user.first_name,
        interests: user.thematic_interests,
      },
    },
  };
}

export function submitProgress(input: {
  user_id: string;
  concept_id: string;
  track: SubjectTrack;
  is_correct: boolean;
  learner_response?: string;
  response_time_sec: number;
  session_id: string;
}): {
  mastery_update: {
    previous_probability: number;
    updated_probability: number;
  };
  xp_awarded: number;
  confetti: { trigger: boolean; opacity: number; frequency: number };
  socratic_feedback: string | null;
  gamification: {
    streak: number;
    streak_freezes: number;
    total_xp: number;
    league: ReturnType<typeof leagueSnapshot>;
    quests: ReturnType<typeof quests>;
  };
} {
  assertSessionActive(input.session_id);

  const mastery = getOrCreateMastery(input.user_id, input.track, input.concept_id);
  const expected = store.answerKey.get(`${input.session_id}:${input.concept_id}`);
  const isCorrect = determineCorrectness(input.is_correct, input.learner_response, expected);

  const previous = mastery.probability_known;
  const posterior = applyBktEvidence(previous, mastery.slip, mastery.guess, isCorrect);
  mastery.probability_known = clampProbability(
    posterior + (1 - posterior) * mastery.transition,
  );
  mastery.updated_at = new Date().toISOString();
  store.mastery.set(masteryKey(input.user_id, input.track, input.concept_id), mastery);

  const gamification = getOrCreateGamification(input.user_id);
  const submittedAt = new Date().toISOString();
  updateDailyStreak(gamification, submittedAt);
  let xp = 0;
  if (isCorrect) {
    xp = input.response_time_sec <= 10 ? 35 : input.response_time_sec <= 20 ? 28 : 20;
    gamification.quick_correct_streak =
      input.response_time_sec <= 20 ? gamification.quick_correct_streak + 1 : 0;
  } else {
    gamification.quick_correct_streak = 0;
  }

  gamification.total_xp += xp;
  gamification.weekly_xp += xp;
  gamification.current_league = pickLeague(gamification.weekly_xp);
  gamification.weekly_rank = Math.max(1, 30 - Math.floor(gamification.weekly_xp / 60));

  if (gamification.quick_correct_streak >= 5) {
    const fade = gamification.quick_correct_streak - 4;
    gamification.confetti_opacity = Math.max(0.2, 1 - fade * 0.15);
    gamification.confetti_frequency = Math.max(0.3, 1 - fade * 0.2);
  } else {
    gamification.confetti_opacity = 1;
    gamification.confetti_frequency = 1;
  }

  let socratic_feedback: string | null = null;
  if (!isCorrect) {
    const misconceptionCount = store.memories.filter(
      (memory) =>
        memory.user_id === input.user_id &&
        memory.concept_id === input.concept_id &&
        memory.kind === "misconception",
    ).length;
    socratic_feedback = buildSocraticQuestion(
      input.track,
      input.concept_id,
      misconceptionCount,
    );
    store.memories.unshift({
      id: randomUUID(),
      user_id: input.user_id,
      concept_id: input.concept_id,
      kind: "misconception",
      text: input.learner_response ?? "No response provided.",
      created_at: submittedAt,
    });
  } else {
    store.memories.unshift({
      id: randomUUID(),
      user_id: input.user_id,
      concept_id: input.concept_id,
      kind: "success",
      text: input.learner_response ?? "Correct response.",
      created_at: submittedAt,
    });
  }

  return {
    mastery_update: {
      previous_probability: previous,
      updated_probability: mastery.probability_known,
    },
    xp_awarded: xp,
    confetti: {
      trigger: isCorrect,
      opacity: gamification.confetti_opacity,
      frequency: gamification.confetti_frequency,
    },
    socratic_feedback,
    gamification: {
      streak: gamification.current_streak,
      streak_freezes: gamification.streak_freezes,
      total_xp: gamification.total_xp,
      league: leagueSnapshot(gamification),
      quests: quests(),
    },
  };
}

export function verifyVideo(input: {
  user_id: string;
  video_id: string;
  watch_duration_sec: number;
  video_duration_sec: number;
  playback_rate_avg: number;
  seek_events: number;
}): {
  verified: boolean;
  completion_ratio: number;
  xp_delta: number;
  reason: string;
  confetti: { trigger: boolean; opacity: number; frequency: number };
  gamification: {
    streak: number;
    streak_freezes: number;
    total_xp: number;
    league: ReturnType<typeof leagueSnapshot>;
    quests: ReturnType<typeof quests>;
  };
} {
  const ratio = input.watch_duration_sec / Math.max(1, input.video_duration_sec);
  const normalSpeed = input.playback_rate_avg >= 0.95 && input.playback_rate_avg <= 1.05;
  const noSeek = input.seek_events === 0;
  const watchedEnough = ratio >= 0.9;
  const verified = watchedEnough && normalSpeed && noSeek;
  const gamification = getOrCreateGamification(input.user_id);
  let xpDelta = 0;
  let reason = "";

  if (verified) {
    xpDelta = 35;
    reason = ">=90% watched at normal speed without skipping.";
    gamification.total_xp += xpDelta;
    gamification.weekly_xp += xpDelta;
    gamification.current_league = pickLeague(gamification.weekly_xp);
    gamification.weekly_rank = Math.max(1, 30 - Math.floor(gamification.weekly_xp / 60));
  } else {
    const failures: string[] = [];
    if (!watchedEnough) failures.push("watch ratio below 90%");
    if (!normalSpeed) failures.push("playback speed not normal");
    if (!noSeek) failures.push("skipping detected");
    reason = failures.join("; ");
  }

  return {
    verified,
    completion_ratio: ratio,
    xp_delta: xpDelta,
    reason,
    confetti: verified
      ? {
          trigger: true,
          opacity: gamification.confetti_opacity,
          frequency: gamification.confetti_frequency,
        }
      : { trigger: false, opacity: 0, frequency: 0 },
    gamification: {
      streak: gamification.current_streak,
      streak_freezes: gamification.streak_freezes,
      total_xp: gamification.total_xp,
      league: leagueSnapshot(gamification),
      quests: quests(),
    },
  };
}
