# Adaptive Learning Platform

A hyper-personalized, end-to-end adaptive learning web and mobile application built for **Ashi**, a 5th-grade student with high mathematical aptitude (6th-grade/Beast Academy level) and reading/writing remediation needs (4th-grade Lexile level). The platform uses **Flow State Design** to transition from extrinsic motivation (gamification/confetti) to intrinsic motivation (curiosity and the joy of problem-solving).

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│           React Native (Expo) - TypeScript           │
│   iOS / Android / Web Cross-Platform Deployment      │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐  │
│  │  Lottie  │ │ YouTube  │ │ React │ │  Visual  │  │
│  │ Confetti │ │  iFrame  │ │  Nav  │ │  Timer   │  │
│  └──────────┘ └──────────┘ └───────┘ └──────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────┐
│                  Backend (NestJS)                     │
│              Node.js / TypeScript                     │
│                                                      │
│  ┌──────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐  │
│  │ BKT  │ │ Content  │ │ Gamifi-  │ │  Session   │  │
│  │Engine│ │ (RAG/AI) │ │ cation   │ │  Manager   │  │
│  └──┬───┘ └────┬─────┘ └────┬─────┘ └────┬───────┘  │
│     │          │             │             │          │
│  ┌──┴───┐ ┌───┴────┐  ┌────┴─────┐  ┌───┴───────┐  │
│  │Postgr│ │ Vector │  │ MongoDB  │  │  Event    │  │
│  │ eSQL │ │  Store │  │          │  │  Emitter  │  │
│  └──────┘ └────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React Native (Expo) | Cross-platform iOS/Android/Web |
| Backend | NestJS (TypeScript) | Microservices API framework |
| Relational DB | PostgreSQL | User profiles, BKT mastery data |
| Document DB | MongoDB | Gamification events, XP ledger |
| Vector DB | In-memory (Pinecone/Chroma ready) | LLM long-term memory |
| Message Broker | NestJS EventEmitter (RabbitMQ ready) | Async gamification events |
| AI | OpenAI GPT-4o / Anthropic Claude 3.5 | Content generation, Socratic tutoring |
| Animation | lottie-react-native | Confetti, visual effects |
| Video | react-native-youtube-iframe | Khan Academy embed |

## Core Epics

### Epic 1: Dual-Track Adaptive Curriculum Engine (BKT)

The Bayesian Knowledge Tracing engine independently tracks mastery across two decoupled tracks:

- **Math Track (6th Grade)**: Integer operations, advanced fractions, ratios, 2D/3D geometry, algebraic expressions, multi-step equations, statistics, number theory puzzles, coordinate plane. Beast Academy/AoPS-style rigor.
- **ELA Track (4th Grade)**: Main idea, vocabulary in context, inferences, sequencing, cause & effect, compare & contrast, grammar, paragraph writing. Constrained to 4th-grade Lexile.

BKT Parameters: P(L0) initial knowledge, P(T) learning rate, P(G) guess probability, P(S) slip probability.

### Epic 2: Hyper-Personalized AI Content & Socratic Tutor

- **RAG Pipeline**: Vector store holds conversation history, misconceptions, and error sequences
- **Persona Pattern**: "Coach Spark" - warm, empathetic tutor who shares Ashi's interests
- **Curiosity Gap**: Multi-part story problems where solving math reveals the next chapter about gymnastics and puppies
- **Socratic Feedback**: On incorrect answers, queries past misconceptions and asks exactly ONE guiding question

### Epic 3: Gamification Engine (Flow State Design)

- **Confetti + Points**: Lottie animations on correct answers that **fade as flow state deepens** (5+ consecutive correct)
- **Streaks**: Daily fire icons with purchasable Streak Freeze items
- **Leagues**: 10 tiers (Bronze → Silver → Gold → Sapphire → Ruby → Emerald → Amethyst → Pearl → Obsidian → Diamond) with 30-person weekly cohorts, promotion zones (top 10-15) and demotion zones (bottom 5)
- **Quests**: Daily time-bound challenges + monthly quests (e.g., "February Quest")

### Epic 4: Neuroscience Session Management

- **Visual Pomodoro Timer**: 15-20 minute focus blocks for pre-teens. No digital numbers - uses a puppy walking across the screen or a gymnast performing a routine
- **Zeigarnik Effect**: When timer expires, content is immediately cut off mid-story to drive the desire to return

### Epic 5: Khan Academy Video Verification

- **YouTube Embed**: react-native-youtube-iframe with YouTube Data API v3
- **Anti-Cheat**: Uses onStateChange, getDuration(), getCurrentTime() to verify 90%+ watch at normal speed
- **XP Rewards**: Only awarded after backend verification passes

## API Contracts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session/start` | POST | Initialize visual timer + BKT-optimized learning path |
| `/api/content/generate` | POST | Trigger LLM with RAG context (requires concept_id, user_id) |
| `/api/progress/submit` | POST | Submit is_correct, update BKT (PG) + emit gamification event (Mongo) |
| `/api/video/verify` | POST | Validate video completion (90% watch) and issue XP |

## Database Schemas

### UserProfile (PostgreSQL)
- `user_id` (UUID, PK)
- `first_name` (String, default: "Ashi")
- `thematic_interests` (Array, default: ["gymnastics", "cute puppies"])
- `math_level` (Integer, default: 6)
- `ela_level` (Integer, default: 4)

### BKTMastery (PostgreSQL)
- `mastery_id` (UUID, PK)
- `user_id` (UUID, FK)
- `concept_id` (String, e.g., "math_6_geometry")
- `probability_known` (Float, 0.0-1.0)
- `subject_track` (Enum: math, ela)

### GamificationState (MongoDB)
- `user_id` (UUID, partition key)
- `current_streak` (Integer)
- `streak_freezes` (Integer)
- `total_xp` (Integer)
- `current_league` (Enum: Bronze...Diamond)
- `active_quests` (Array of quest objects)

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for databases)
- Expo CLI (`npm install -g expo-cli`)

### Quick Start

1. **Start databases:**
```bash
docker-compose up -d postgres mongodb rabbitmq
```

2. **Start backend:**
```bash
cd backend
cp .env.example .env
# Add your OPENAI_API_KEY or ANTHROPIC_API_KEY to .env (optional)
npm install --legacy-peer-deps
npm run start:dev
```

3. **Start frontend:**
```bash
cd frontend
npm install
npx expo start
```

4. **API Documentation:**
Visit `http://localhost:3000/api/docs` for Swagger UI.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_HOST` | Yes | PostgreSQL host |
| `POSTGRES_PORT` | Yes | PostgreSQL port (default: 5432) |
| `POSTGRES_USER` | Yes | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `POSTGRES_DB` | Yes | PostgreSQL database name |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `OPENAI_API_KEY` | No | OpenAI API key for GPT-4o |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for Claude 3.5 |
| `PINECONE_API_KEY` | No | Pinecone vector DB key (production) |

## Project Structure

```
/
├── backend/                     # NestJS Backend
│   ├── src/
│   │   ├── bkt/                 # Bayesian Knowledge Tracing engine
│   │   ├── content/             # AI content generation + RAG + Socratic tutor
│   │   ├── gamification/        # XP, streaks, leagues, quests, flow state
│   │   ├── session/             # Pomodoro timer, Zeigarnik effect, progress
│   │   ├── user/                # User profile management
│   │   ├── video/               # Khan Academy video verification
│   │   ├── database/            # Entity definitions (PG + Mongo schemas)
│   │   └── common/              # Shared interfaces
│   ├── Dockerfile
│   └── .env.example
├── frontend/                    # Expo React Native
│   ├── src/
│   │   ├── screens/             # Home, Learning, League, Videos, Profile
│   │   ├── components/          # Confetti, Timer, Streak, XP, League, Quest, Video
│   │   ├── services/            # API client
│   │   ├── navigation/          # Stack + Tab navigation
│   │   ├── constants/           # Theme, API config
│   │   ├── types/               # TypeScript interfaces
│   │   └── assets/              # Lottie animations
│   └── App.tsx
├── docker-compose.yml           # PostgreSQL, MongoDB, RabbitMQ
└── README.md
```
