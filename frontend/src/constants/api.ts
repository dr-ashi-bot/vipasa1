import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  SESSION_START: '/api/session/start',
  CONTENT_GENERATE: '/api/content/generate',
  PROGRESS_SUBMIT: '/api/progress/submit',
  VIDEO_VERIFY: '/api/video/verify',
  VIDEO_RECOMMENDATIONS: '/api/video/recommendations',
  USERS: '/api/users',
};
