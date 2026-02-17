# Adaptive Learning Platform (Flow-State Tutor)

End-to-end adaptive learning app (mobile + web) for a 5th-grade learner (“Ashi”), with:

- **Dual-track mastery**: math reasoning (6th-grade / Beast Academy style) decoupled from ELA reading level (4th-grade Lexile).
- **Hyper-personalized AI tutor**: retrieval-augmented memory + Socratic feedback (one guiding question on incorrect answers).
- **Event-driven gamification**: points/streaks/leagues/quests via async events.
- **Neuroscience session boundaries**: immutable focus blocks with **visual** timers (no countdown numbers).
- **Video verification**: YouTube IFrame-based watch validation (≥ 90%).

## Repo layout

- `apps/mobile`: Expo React Native app (iOS/Android/Web)
- `services/api`: NestJS API (REST)
- `infra/docker-compose.yml`: Postgres + Mongo + RabbitMQ + Chroma for local dev

## Quickstart (local dev)

Start infrastructure:

```bash
npm run dev:infra
```

Run API:

```bash
npm run dev:api
```

Run mobile/web app:

```bash
npm run dev:mobile
```

## Environment variables

- API service: copy `services/api/.env.example` to `services/api/.env`
- Mobile app: copy `apps/mobile/.env.example` to `apps/mobile/.env`