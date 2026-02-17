const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

async function postJson<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API ${path} failed (${response.status}): ${errorBody}`);
  }
  return (await response.json()) as T;
}

export async function startSession(user_id?: string): Promise<unknown> {
  return postJson("/session/start", { user_id });
}

export async function generateContent(payload: {
  user_id: string;
  session_id: string;
  concept_id: string;
  track: "Math" | "ELA";
}): Promise<unknown> {
  return postJson("/content/generate", payload);
}

export async function submitProgress(payload: {
  user_id: string;
  session_id: string;
  concept_id: string;
  track: "Math" | "ELA";
  is_correct: boolean;
  learner_response: string;
  response_time_sec: number;
}): Promise<unknown> {
  return postJson("/progress/submit", payload);
}

export async function verifyVideo(payload: {
  user_id: string;
  video_id: string;
  watch_duration_sec: number;
  video_duration_sec: number;
  playback_rate_avg: number;
  seek_events: number;
}): Promise<unknown> {
  return postJson("/video/verify", payload);
}
