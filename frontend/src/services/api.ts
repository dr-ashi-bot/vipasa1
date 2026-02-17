import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import type {
  SessionConfig,
  GeneratedContent,
  ProgressResult,
  VideoVerificationResult,
  UserProfile,
} from '../types';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const apiService = {
  /**
   * POST /api/session/start
   * Initialize the visual timer and query BKT for optimal learning path.
   */
  async startSession(
    userId: string,
    preferredTrack?: 'math' | 'ela',
    durationMinutes?: number,
  ): Promise<SessionConfig> {
    const { data } = await client.post<SessionConfig>(
      API_ENDPOINTS.SESSION_START,
      {
        user_id: userId,
        preferred_track: preferredTrack,
        duration_minutes: durationMinutes,
      },
    );
    return data;
  },

  /**
   * POST /api/content/generate
   * Trigger the LLM with context injected from the Vector DB.
   */
  async generateContent(
    userId: string,
    conceptId: string,
  ): Promise<GeneratedContent> {
    const { data } = await client.post<GeneratedContent>(
      API_ENDPOINTS.CONTENT_GENERATE,
      {
        user_id: userId,
        concept_id: conceptId,
      },
    );
    return data;
  },

  /**
   * POST /api/progress/submit
   * Submit answer, update BKT + emit gamification event.
   */
  async submitProgress(params: {
    user_id: string;
    concept_id: string;
    session_id?: string;
    is_correct: boolean;
    user_answer?: string;
    correct_answer?: string;
    question?: string;
    time_taken_seconds?: number;
  }): Promise<ProgressResult> {
    const { data } = await client.post<ProgressResult>(
      API_ENDPOINTS.PROGRESS_SUBMIT,
      params,
    );
    return data;
  },

  /**
   * POST /api/video/verify
   * Validate video completion and issue XP rewards.
   */
  async verifyVideo(params: {
    user_id: string;
    video_id: string;
    video_duration_sec: number;
    watch_duration_sec: number;
    start_time: number;
    end_time: number;
  }): Promise<VideoVerificationResult> {
    const { data } = await client.post<VideoVerificationResult>(
      API_ENDPOINTS.VIDEO_VERIFY,
      params,
    );
    return data;
  },

  async createUser(
    firstName?: string,
    interests?: string[],
  ): Promise<UserProfile> {
    const { data } = await client.post<UserProfile>(API_ENDPOINTS.USERS, {
      first_name: firstName,
      thematic_interests: interests,
    });
    return data;
  },

  async getUser(userId: string): Promise<UserProfile> {
    const { data } = await client.get<UserProfile>(
      `${API_ENDPOINTS.USERS}/${userId}`,
    );
    return data;
  },
};
