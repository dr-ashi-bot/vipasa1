# Adaptive Learning Platform Core (Ashi Profile)

End-to-end monorepo implementation for a hyper-personalized adaptive learning app:

- **Frontend:** React Native (Expo; iOS/Android/Web)
- **Backend:** NestJS (TypeScript)
- **Data stack:** PostgreSQL entities, MongoDB schema, Chroma vector memory hooks
- **Async events:** RabbitMQ progress event publisher
- **AI integration:** OpenAI-compatible tutor service with Socratic guardrails
- **Animation/video:** `lottie-react-native`, `react-native-youtube-iframe`

## Product fit implemented

### Epic 1: Dual-track adaptive engine (BKT)

- Separate subject tracks: `MATH` and `ELA`
- Bayesian Knowledge Tracing update logic in `backend/src/bkt/bkt.service.ts`
- Grade targeting:
  - Math prompts target grade 6 puzzle/discovery style
  - ELA prompts constrained to grade 4 readability

### Epic 2: Hyper-personalized tutor + long-term memory

- Vector memory service with Chroma support + in-memory fallback:
  - `backend/src/vector/vector-memory.service.ts`
- Persona and role prompting (Ashi + gymnastics + cute puppies every narrative):
  - `backend/src/tutor/tutor.service.ts`
- Incorrect answers trigger exactly one Socratic question (no answer reveal):
  - enforced in `ensureSingleQuestion(...)`

### Epic 3: Extrinsic -> intrinsic gamification

- Correct answers award XP + confetti intensity controls
- Fast 5-correct streak reduces confetti opacity/frequency
- Daily streaks + purchasable streak freeze
- 30-person league board with 10 tiers:
  - Bronze, Silver, Gold, Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, Diamond
- Promotion and demotion zones included in league response
- Time-bound and monthly quests

### Epic 4: Session neuroscience / Pomodoro

- Immutable 15-20 minute focus sessions from `/api/session/start`
- Visual-only timer in mobile app (no digital countdown)
- Content gates shut after expiration to trigger Zeigarnik return effect

### Epic 5: Video verification anti-cheat

- Embedded YouTube IFrame player (`react-native-youtube-iframe`)
- Completion reward only if backend verifies:
  - watched >= 90%
  - playback at normal speed
  - no seeking

## API contracts implemented (NestJS)

All endpoints are under `/api`:

- `POST /api/session/start`
- `POST /api/content/generate`
- `POST /api/progress/submit`
- `POST /api/video/verify`

Additional helper endpoints:

- `POST /api/gamification/streak-freeze/purchase`
- `GET /api/gamification/state/:user_id`

## Repo structure

```text
/backend   NestJS API + adaptive logic
/mobile    Expo React Native app
```

## Quick start

1. Install dependencies (already done in this scaffold):

```bash
npm install
```

2. Start infra (optional but recommended for full stack):

```bash
docker compose up -d
```

3. Configure backend:

```bash
cp backend/.env.example backend/.env
```

4. Run backend:

```bash
npm run dev:backend
```

5. Configure mobile:

```bash
cp mobile/.env.example mobile/.env
```

6. Run mobile:

```bash
npm run dev:mobile
```

## Notes

- Database and vector adapters include in-memory fallbacks so the demo can run without external services.
- For production, set `POSTGRES_ENABLED=true` and `MONGO_ENABLED=true` in backend env.