export type SubjectTrack = 'MATH' | 'ELA';

export interface SessionStartResponse {
  user_profile: {
    user_id: string;
    first_name: string;
    thematic_interests: string[];
    math_level: number;
    ela_level: number;
  };
  session_timer: {
    session_id: string;
    focus_block_min: number;
    started_at: string;
    expires_at: string;
    visual_mode: 'puppy-walk' | 'gymnast-routine';
    progress_ratio: number;
    is_expired: boolean;
  };
  optimal_learning_path: {
    recommended_track: SubjectTrack;
    math_next_concept: {
      concept_id: string;
      probability_known: number;
    };
    ela_next_concept: {
      concept_id: string;
      probability_known: number;
    };
  };
  quests: Array<{
    title: string;
    objective: string;
    expires_at: string;
  }>;
}

export interface GeneratedContentResponse {
  user_id: string;
  track: SubjectTrack;
  concept_id: string;
  lexile_target: string;
  content: {
    title: string;
    story_intro: string;
    prompt: string;
    story_cliffhanger: string;
    expected_answer_format: string;
  };
  timer: SessionStartResponse['session_timer'];
}

export interface SubmitProgressResponse {
  session_expired: boolean;
  zeigarnik_prompt?: string;
  mastery?: {
    mastery_id: string;
    probability_known: number;
    opportunities: number;
    subject: string;
    concept_id: string;
  };
  socratic_question?: string;
  gamification?: {
    state: {
      user_id: string;
      current_streak: number;
      streak_freezes: number;
      total_xp: number;
      current_league: string;
      weekly_xp: number;
      fast_correct_streak: number;
      last_active_at: string | null;
    };
    xp_earned: number;
    flow_state: {
      confetti_enabled: boolean;
      confetti_opacity: number;
      confetti_frequency: 'full' | 'reduced';
    };
    league: {
      tier: string;
      rank: number;
      cohort_size: number;
      promotion_zone: number;
      demotion_zone_start: number;
      entries: Array<{
        user_id: string;
        display_name: string;
        xp: number;
        rank: number;
      }>;
    };
    quests: Array<{
      title: string;
      objective: string;
      expires_at: string;
    }>;
  };
}

export interface VerifyVideoResponse {
  verified: boolean;
  reason: string;
  xp_awarded: number;
  should_trigger_confetti: boolean;
  gamification_state: {
    user_id: string;
    current_streak: number;
    streak_freezes: number;
    total_xp: number;
    current_league: string;
    weekly_xp: number;
    fast_correct_streak: number;
    last_active_at: string | null;
  };
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function post<TResponse>(
  path: string,
  payload: Record<string, unknown>,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API ${path} failed: ${response.status} ${message}`);
  }
  return (await response.json()) as TResponse;
}

export const apiClient = {
  startSession: (payload: { user_id: string; focus_block_min: number }) =>
    post<SessionStartResponse>('/api/session/start', payload),
  generateContent: (payload: {
    user_id: string;
    concept_id: string;
    track: SubjectTrack;
  }) => post<GeneratedContentResponse>('/api/content/generate', payload),
  submitProgress: (payload: {
    user_id: string;
    concept_id: string;
    track: SubjectTrack;
    is_correct: boolean;
    learner_response: string;
    response_time_ms: number;
  }) => post<SubmitProgressResponse>('/api/progress/submit', payload),
  verifyVideo: (payload: {
    user_id: string;
    video_id: string;
    watch_duration_sec: number;
    video_duration_sec: number;
    playback_rate: number;
    did_seek: boolean;
  }) => post<VerifyVideoResponse>('/api/video/verify', payload),
  purchaseStreakFreeze: (payload: { user_id: string }) =>
    post<{
      purchased: boolean;
      cost_xp: number;
      state: SubmitProgressResponse['gamification'] extends {
        state: infer TState;
      }
        ? TState
        : never;
    }>('/api/gamification/streak-freeze/purchase', payload),
};
