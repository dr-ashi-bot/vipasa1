# VIPASA Adaptive Learning Platform

End-to-end scaffold for a hyper-personalized adaptive learning experience designed around:
- High-rigor 6th-grade math discovery learning
- 4th-grade Lexile ELA scaffolding
- Flow-state transition from extrinsic rewards (confetti/XP) to intrinsic curiosity
- Ashi-centered narrative personalization (gymnastics + cute puppies)

## Monorepo Layout
```
apps/
  backend/   # NestJS API + BKT + gamification + AI/RAG services
  mobile/    # Expo React Native app (iOS/Android/Web)
docs/
  PRD.md     # Product requirements and implementation mapping
docker-compose.yml
```

## Stack
- Frontend: React Native (Expo)
- Backend: NestJS (Node.js, TypeScript)
- PostgreSQL: user profile + BKT mastery
- MongoDB: gamification state + XP ledger
- Chroma: vector long-term memory
- RabbitMQ: async gamification events
- OpenAI API: adaptive content + Socratic tutoring
- Lottie: confetti animations
- YouTube IFrame: video lesson verification

## Quick Start

### 1) Infrastructure
```bash
cp .env.example .env
docker compose up -d
```

### 2) Install dependencies
```bash
npm install
```

### 3) Start backend
```bash
npm run start:backend
```

### 4) Start mobile app
```bash
npm run start:mobile
```

## API Endpoints
- `POST /api/session/start`
- `POST /api/content/generate`
- `POST /api/progress/submit`
- `POST /api/video/verify`

See `docs/PRD.md` for acceptance-criteria mapping.

## Notes
- Session timer is visual-only (no numeric countdown) and locks content after expiry.
- Incorrect answers return exactly one Socratic guiding question (no answer reveal).
- Confetti opacity/frequency fades during fast correct streaks to support intrinsic motivation.