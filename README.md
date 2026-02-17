# Adaptive Learning Platform

A hyper-personalized adaptive learning web and mobile application for students like Ashi—with dual-track curriculum (Math 6th-grade / ELA 4th-grade), AI Socratic tutoring, and flow-state gamification.

## Tech Stack

- **Frontend**: React Native (Expo) — iOS, Android, Web
- **Backend**: NestJS (TypeScript)
- **Databases**: PostgreSQL (user/BKT), MongoDB (gamification)
- **AI**: OpenAI GPT-4o
- **Animation**: Lottie (confetti)
- **Video**: react-native-youtube-iframe (Khan Academy)

## Quick Start

### 1. Start Databases

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Add OPENAI_API_KEY for AI content
npm install
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL=http://localhost:3000` (or your backend URL) for API calls.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session/start` | Start session, get learning path |
| POST | `/api/content/generate` | Generate personalized problem |
| POST | `/api/progress/submit` | Submit answer, update BKT |
| POST | `/api/video/verify` | Verify video watch, award XP |
| GET | `/api/gamification/state` | Get streaks, XP, league |
| GET | `/api/gamification/quests` | Get time-bound & monthly quests |

## Features

- **Dual-Track BKT**: Math (6th/Beast Academy) and ELA (4th Lexile) with Bayesian Knowledge Tracing
- **RAG Memory**: Vector-store for misconceptions, preferences, error sequences
- **Socratic Tutor**: Persona pattern, curiosity-gap narratives (gymnastics, puppies)
- **Gamification**: Confetti (fades with flow), streaks, streak freeze, 10-tier leagues
- **Pomodoro**: 18-min visual timer (no digital numbers)
- **Video Verification**: 90% watch threshold for XP

## License

Proprietary
