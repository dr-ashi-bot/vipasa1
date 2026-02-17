# Adaptive Learning Platform

An end-to-end, highly scalable, and hyper-personalized adaptive learning web and mobile application built with **Flow State Design** principles.

## Target User

**Ashi** - a 5th-grade student with:
- **High mathematical aptitude** (ready for 6th-grade/Beast Academy level)
- **Reading/writing remediation needs** (4th-grade Lexile level)
- **Interests**: Gymnastics and cute puppies

## Architecture Overview

```
frontend/          React Native (Expo) - Cross-platform iOS/Android/Web
backend/           NestJS (TypeScript) - Microservices API
docker-compose.yml PostgreSQL + MongoDB + RabbitMQ + ChromaDB
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React Native (Expo) | Cross-platform deployment |
| Backend | NestJS (TypeScript) | Microservices API |
| Relational DB | PostgreSQL | User profiles, BKT mastery tracking |
| Document DB | MongoDB | Gamification events, XP ledgers |
| Vector DB | Pinecone / ChromaDB | LLM long-term memory (RAG) |
| Message Broker | RabbitMQ | Async event-driven gamification |
| AI | OpenAI GPT-4o / Anthropic Claude 3.5 | Content generation, Socratic tutor |
| Animation | lottie-react-native | Confetti animations |
| Video | react-native-youtube-iframe | Khan Academy integration |

## Core Epics

### Epic 1: Dual-Track Adaptive Curriculum Engine (BKT)

Implements **Bayesian Knowledge Tracing** with completely decoupled math and ELA tracks:

- **Math Track**: Grade 6 Beast Academy rigor (3D solids, integer operations, multi-step equations, combinatorics)
- **ELA Track**: Grade 4 Lexile level (simple sentence structures, decodable words)
- Independent mastery probabilities per concept: P(L), P(T), P(S), P(G)
- Automatic concept seeding and optimal next-concept selection

### Epic 2: Hyper-Personalized AI Content & Socratic Tutor

**RAG (Retrieval-Augmented Generation) Pipeline**:

- Vector database stores conversation history, preferences, and error patterns
- **Persona Pattern**: Warm, empathetic tutor that loves gymnastics and puppies
- **Curiosity Gap**: Math problems woven into multi-part stories featuring Ashi
- **Socratic Feedback**: On incorrect answers, asks exactly ONE guiding question (never gives the answer)

### Epic 3: Extrinsic to Intrinsic Gamification Engine

**Flow State Design** - transitions from extrinsic to intrinsic motivation:

- **Confetti & Points**: Full-screen Lottie animations on correct answers
  - After 5 consecutive correct answers, confetti opacity/frequency gradually fades
- **Streaks**: Daily streak tracking with fire icons and purchasable Streak Freezes
- **Leagues**: 10-tier system (Bronze → Diamond) with 30-person weekly cohorts
  - Promotion zones (top 10-15) and Demotion zones (bottom 5)
- **Quests**: Daily time-bound challenges and monthly quests

### Epic 4: Neuroscience Session Management (Pomodoro)

- **Immutable 15-20 minute focus blocks** for pre-teens
- **Visual timer** (no digital numbers): puppy walking or gymnast performing
- **Zeigarnik Effect**: Cuts off content at timer expiry to drive return

### Epic 5: Khan Academy Video Verification

- YouTube IFrame API integration with anti-cheat:
  - Must watch ≥90% of video at normal speed
  - Validates `getCurrentTime()` vs `getDuration()` deltas
  - Prevents double-claiming XP

## Database Schemas

### PostgreSQL

**UserProfile**:
- `user_id` (UUID, PK), `first_name`, `thematic_interests[]`, `math_level`, `ela_level`

**BKTMastery**:
- `mastery_id` (UUID, PK), `user_id` (FK), `concept_id`, `track`, `probability_known` (0.0-1.0)

### MongoDB

**GamificationState**:
- `user_id`, `current_streak`, `streak_freezes`, `total_xp`, `weekly_xp`, `current_league` (10 tiers)

**XPEvent** / **Leaderboard**:
- High-throughput event sourcing for gamification

## API Contracts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session/start` | POST | Initialize visual timer + BKT learning path |
| `/api/content/generate` | POST | RAG-powered content generation (LLM + Vector DB) |
| `/api/progress/submit` | POST | Submit answer → BKT update + gamification event |
| `/api/video/verify` | POST | Anti-cheat video verification → XP reward |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL, MongoDB, RabbitMQ, and ChromaDB.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys (OpenAI/Anthropic, Pinecone, YouTube)
npm install
npm run start:dev
```

API available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

Scan QR code with Expo Go app, or press `w` for web.

## Project Structure

```
backend/
├── src/
│   ├── user/           # User profile management (PostgreSQL)
│   ├── bkt/            # Bayesian Knowledge Tracing engine
│   ├── content/        # RAG pipeline + AI content generation
│   ├── gamification/   # XP, streaks, leagues, quests (MongoDB)
│   ├── session/        # Pomodoro timer + Zeigarnik Effect
│   ├── video/          # YouTube verification + anti-cheat
│   └── common/         # Shared enums, DTOs, utilities
│
frontend/
├── src/
│   ├── api/            # API client (axios)
│   ├── components/     # Reusable UI components
│   │   ├── ConfettiOverlay.tsx   # Lottie confetti with flow-state fade
│   │   ├── VisualTimer.tsx       # Puppy/gymnast animated timer
│   │   ├── StreakDisplay.tsx     # Fire icons + streak freeze
│   │   ├── LeagueDisplay.tsx     # 10-tier leaderboard
│   │   ├── QuestPanel.tsx        # Daily/monthly quests
│   │   └── VideoPlayer.tsx       # YouTube with anti-cheat
│   ├── screens/        # App screens
│   ├── types/          # TypeScript type definitions
│   └── assets/         # Lottie animations, images
```

## License

MIT
