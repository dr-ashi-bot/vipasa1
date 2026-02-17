# VIPASA1 — Adaptive Learning Platform (Ashi)

End-to-end adaptive learning app built for a 5th-grade learner (“Ashi”) with **6th-grade math** targeting and **4th-grade reading** constraints, using **Flow State Design** and an event-driven gamification system.

## Architecture

- **Frontend**: Expo (React Native) for iOS/Android/Web (`apps/mobile`)
- **Backend**: NestJS (Node.js + TypeScript) (`apps/backend`)
- **Datastores**
  - **PostgreSQL**: user profile + curriculum + BKT mastery
  - **MongoDB**: gamification state + XP + streaks
  - **Chroma**: vector memory (RAG)
- **Message broker**: RabbitMQ (async gamification events)
- **AI**: OpenAI (configurable via env)

## Local development

### 1) Start infrastructure (Postgres/Mongo/RabbitMQ/Chroma)

```bash
cp .env.example .env
npm run infra:up
```

RabbitMQ UI runs at `http://localhost:15672` (user/pass: `vipasa` / `vipasa`).

### 2) Run backend

```bash
npm run backend:dev
```

### 3) Run Expo app (web is easiest in CI environments)

```bash
npm run mobile:web
```

## Required API endpoints

The backend implements these REST contracts under the `/api` prefix:

- `POST /api/session/start`
- `POST /api/content/generate`
- `POST /api/progress/submit`
- `POST /api/video/verify`