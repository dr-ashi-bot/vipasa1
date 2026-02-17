import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session API
export const sessionApi = {
  start: (data: { user_id: string; session_duration_minutes?: number; visual_timer_type?: 'puppy' | 'gymnast' }) =>
    api.post('/session/start', data),
  
  getActive: (user_id: string) =>
    api.get(`/session/active/${user_id}`),
  
  checkExpiry: (session_id: string) =>
    api.get(`/session/expiry/${session_id}`),
  
  end: (session_id: string) =>
    api.post(`/session/end/${session_id}`),
};

// Content API
export const contentApi = {
  generate: (data: { user_id: string; concept_id: string; difficulty_override?: number }) =>
    api.post('/content/generate', data),
  
  getFeedback: (data: { user_id: string; concept_id: string; user_answer: string; correct_answer: string }) =>
    api.post('/content/feedback', data),
};

// Progress API
export const progressApi = {
  submit: (data: {
    user_id: string;
    session_id: string;
    content_id: string;
    concept_id: string;
    is_correct: boolean;
    time_taken_seconds: number;
    answer_given: string;
  }) => api.post('/progress/submit', data),
  
  getMastery: (user_id: string) =>
    api.get(`/progress/mastery/${user_id}`),
  
  getStats: (user_id: string) =>
    api.get(`/progress/stats/${user_id}`),
  
  getRecommendations: (user_id: string, domain: 'math' | 'ela') =>
    api.get(`/progress/recommend/${user_id}/${domain}`),
};

// Video API
export const videoApi = {
  verify: (data: {
    user_id: string;
    video_id: string;
    watch_duration_sec: number;
    video_duration_sec: number;
    playback_rate?: number;
  }) => api.post('/video/verify', data),
  
  getRecommended: (concept_id: string) =>
    api.get(`/video/recommended/${concept_id}`),
};

// Gamification API
export const gamificationApi = {
  getState: (user_id: string) =>
    api.get(`/gamification/state/${user_id}`),
  
  getLeaderboard: () =>
    api.get('/gamification/leaderboard'),
  
  getLeagueStanding: (user_id: string) =>
    api.get(`/gamification/league/${user_id}`),
  
  useStreakFreeze: (user_id: string) =>
    api.post('/gamification/streak-freeze/use', { user_id }),
  
  purchaseStreakFreeze: (user_id: string) =>
    api.post('/gamification/streak-freeze/purchase', { user_id }),
};

// User API
export const userApi = {
  get: (user_id: string) =>
    api.get(`/users/${user_id}`),
  
  create: (data: { first_name?: string; thematic_interests?: string[]; math_level?: number; ela_level?: number }) =>
    api.post('/users', data),
  
  update: (user_id: string, data: Partial<any>) =>
    api.put(`/users/${user_id}`, data),
};

export default api;
