import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const DEFAULT_USER_ID = 'ashi-default-user-id';

export async function startSession(userId: string) {
  const { data } = await api.post('/api/session/start', { user_id: userId });
  return data;
}

export async function generateContent(
  userId: string,
  conceptId: string,
  track: 'math' | 'ela',
  partIndex?: number
) {
  const { data } = await api.post('/api/content/generate', {
    user_id: userId,
    concept_id: conceptId,
    track,
    part_index: partIndex,
  });
  return data;
}

export async function getSocraticQuestion(
  userId: string,
  conceptId: string,
  userAnswer: string,
  problem: string
) {
  const { data } = await api.post('/api/content/socratic-question', {
    user_id: userId,
    concept_id: conceptId,
    user_answer: userAnswer,
    problem,
  });
  return data;
}

export async function submitProgress(
  userId: string,
  conceptId: string,
  isCorrect: boolean,
  options?: { userAnswer?: string; problem?: string; correctInRow?: number }
) {
  const { data } = await api.post('/api/progress/submit', {
    user_id: userId,
    concept_id: conceptId,
    is_correct: isCorrect,
    ...options,
  });
  return data;
}

export async function verifyVideo(
  userId: string,
  videoDurationSec: number,
  watchDurationSec: number
) {
  const { data } = await api.post('/api/video/verify', {
    user_id: userId,
    video_duration_sec: videoDurationSec,
    watch_duration_sec: watchDurationSec,
  });
  return data;
}

export async function getGamificationState(userId: string) {
  const { data } = await api.get('/api/gamification/state', {
    params: { user_id: userId },
  });
  return data;
}

export async function getQuests() {
  const { data } = await api.get('/api/gamification/quests');
  return data;
}

export async function getLeaderboard(userId: string) {
  const { data } = await api.get('/api/gamification/leaderboard', {
    params: { user_id: userId },
  });
  return data;
}
