# VIPASA Adaptive Learning PRD + Implementation Guide

## Objective
Build an end-to-end, highly scalable, and hyper-personalized adaptive learning platform for web/mobile, optimized for Ashi (high math aptitude with reading/writing remediation needs), while transitioning motivation from extrinsic rewards to intrinsic curiosity.

## Learner Profile Defaults
- Name: **Ashi**
- Interests: **gymnastics**, **cute puppies**
- Math level target: **6th-grade / puzzle-discovery rigor**
- ELA level target: **4th-grade Lexile**

## Implemented Technology Stack
- **Frontend:** React Native with Expo (`apps/mobile`)
- **Backend:** NestJS + TypeScript (`apps/backend`)
- **Relational DB:** PostgreSQL (TypeORM entities for `UserProfile`, `BKTMastery`)
- **High-throughput gamification DB:** MongoDB (Mongoose schemas for state + XP ledger)
- **Vector memory store:** Chroma-compatible integration + in-memory fallback
- **Message broker:** RabbitMQ queue integration with in-process fallback
- **AI model integration:** OpenAI API support (`gpt-4o` by default)
- **Animation:** `lottie-react-native` confetti layer
- **Video:** `react-native-youtube-iframe` (YouTube callbacks + verification payload)

## Epic 1: Dual-Track Adaptive Curriculum (BKT)
### Delivered
- Separate BKT records by **track** (`Math` / `ELA`) + `concept_id`.
- Bayesian Knowledge Tracing update formula in `BktService`.
- Curriculum planner chooses least-mastered concept independently for Math and ELA.
- Math concept pool includes:
  - `math_6_geometry_3d_solids`
  - `math_6_integer_operations`
  - `math_6_multi_step_equations`
- ELA concept pool includes:
  - `ela_4_decodable_words`
  - `ela_4_main_idea`
  - `ela_4_sentence_fluency`

## Epic 2: Hyper-Personalized AI + Socratic Tutor (RAG)
### Delivered
- Vector memory service stores:
  - prior successes/misconceptions
  - generated content history
  - concept-linked context
- Prompt engineering uses:
  - Persona pattern (empathetic tutor)
  - Role prompting (metacognition, discovery over direct answers)
  - Persistent Ashi narrative injection (gymnastics + puppies)
- Incorrect-answer flow:
  - retrieves past misconception traces
  - asks **exactly one** Socratic guiding question
  - explicitly avoids answer disclosure

## Epic 3: Extrinsic -> Intrinsic Gamification
### Delivered
- Correct responses award XP and trigger confetti metadata.
- Flow-state fade:
  - if quick-correct streak >= 5, confetti opacity/frequency gradually decreases.
- Daily streak + fire icon model.
- Streak freeze support in state model (consumed on missed-day gap).
- 10-tier league model implemented exactly:
  - Bronze, Silver, Gold, Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, Diamond
- 30-person cohort framing with promotion and demotion zones.
- Quest generation:
  - time-bound quick challenge
  - monthly quest titled `<Month> Quest`

## Epic 4: Neuroscience Session Management
### Delivered
- Immutable session duration clamped to 15-20 minutes.
- Visual timer pattern (puppy walk / gymnast routine), no numeric countdown UI.
- Session expiry blocks new content and progress submissions to enforce re-engagement next day.

## Epic 5: Khan Academy Video Verification
### Delivered
- YouTube iframe embedded in mobile app.
- Client sends watch metrics to backend:
  - `watch_duration_sec`
  - `video_duration_sec`
  - `playback_rate_avg`
  - `seek_events`
- Backend awards XP only if:
  - >= 90% watched
  - normal speed (~1x)
  - no seek events

## Required API Contracts (Implemented)
- `POST /api/session/start`
- `POST /api/content/generate`
- `POST /api/progress/submit`
- `POST /api/video/verify`

## Data Models
### PostgreSQL
- `user_profiles` (maps to `UserProfile`)
- `bkt_mastery` (maps to `BKTMastery`)

### MongoDB
- `gamification_states`
- `xp_ledger_events`

## Operational Notes
- Infrastructure dependencies are provided in root `docker-compose.yml`.
- Environment variables are documented in root `.env.example`.
- RabbitMQ and Chroma failures fall back to in-process behavior to keep local development resilient.
