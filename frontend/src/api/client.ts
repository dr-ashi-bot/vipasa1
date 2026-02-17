import axios from 'axios';
import {
  SessionResponse,
  ContentResponse,
  ProgressResponse,
  VideoVerifyResponse,
  LeaderboardResponse,
  GamificationState,
  UserProfile,
} from '../types';

const API_BASE = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.adaptive-learning.app';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// POST /api/session/start
export async function startSession(
  userId: string,
  durationMinutes?: number,
): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>('/api/session/start', {
    user_id: userId,
    duration_minutes: durationMinutes,
  });
  return data;
}

// GET /api/session/status/:userId
export async function getSessionStatus(
  userId: string,
): Promise<{
  is_active: boolean;
  remaining_seconds: number;
  progress_fraction: number;
  is_expired: boolean;
  zeigarnik_message: string | null;
}> {
  const { data } = await api.get(`/api/session/status/${userId}`);
  return data;
}

// POST /api/content/generate
export async function generateContent(
  userId: string,
  conceptId: string,
  previousAnswer?: string,
  sessionId?: string,
): Promise<ContentResponse> {
  const { data } = await api.post<ContentResponse>('/api/content/generate', {
    user_id: userId,
    concept_id: conceptId,
    previous_answer: previousAnswer,
    session_id: sessionId,
  });
  return data;
}

// POST /api/progress/submit
export async function submitProgress(
  userId: string,
  conceptId: string,
  isCorrect: boolean,
): Promise<ProgressResponse> {
  const { data } = await api.post<ProgressResponse>('/api/progress/submit', {
    user_id: userId,
    concept_id: conceptId,
    is_correct: isCorrect,
  });
  return data;
}

// POST /api/video/verify
export async function verifyVideo(
  userId: string,
  videoId: string,
  watchDurationSec: number,
  totalDurationSec: number,
  playbackRate: number,
): Promise<VideoVerifyResponse> {
  const { data } = await api.post<VideoVerifyResponse>('/api/video/verify', {
    user_id: userId,
    video_id: videoId,
    watch_duration_sec: watchDurationSec,
    total_duration_sec: totalDurationSec,
    playback_rate: playbackRate,
  });
  return data;
}

// GET /api/progress/leaderboard/:userId
export async function getLeaderboard(
  userId: string,
): Promise<LeaderboardResponse> {
  const { data } = await api.get<LeaderboardResponse>(
    `/api/progress/leaderboard/${userId}`,
  );
  return data;
}

// GET /api/progress/state/:userId
export async function getGamificationState(
  userId: string,
): Promise<GamificationState> {
  const { data } = await api.get<GamificationState>(
    `/api/progress/state/${userId}`,
  );
  return data;
}

// POST /api/users
export async function createUser(
  firstName?: string,
  interests?: string[],
): Promise<UserProfile> {
  const { data } = await api.post<UserProfile>('/api/users', {
    first_name: firstName,
    thematic_interests: interests,
  });
  return data;
}

export default api;
