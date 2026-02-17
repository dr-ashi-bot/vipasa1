import type { BktMastery, GamificationState, MemoryEvent, SessionState, UserProfile } from "./types";

interface InMemoryStore {
  userProfiles: Map<string, UserProfile>;
  mastery: Map<string, BktMastery>;
  gamification: Map<string, GamificationState>;
  sessions: Map<string, SessionState>;
  memories: MemoryEvent[];
  answerKey: Map<string, string>;
}

declare global {
  // eslint-disable-next-line no-var
  var __vipasaWebStore: InMemoryStore | undefined;
}

function createStore(): InMemoryStore {
  return {
    userProfiles: new Map<string, UserProfile>(),
    mastery: new Map<string, BktMastery>(),
    gamification: new Map<string, GamificationState>(),
    sessions: new Map<string, SessionState>(),
    memories: [],
    answerKey: new Map<string, string>(),
  };
}

export const store = globalThis.__vipasaWebStore ?? createStore();

if (!globalThis.__vipasaWebStore) {
  globalThis.__vipasaWebStore = store;
}
