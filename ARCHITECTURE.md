# Adaptive Learning Platform - Architecture Documentation

## System Overview

The Adaptive Learning Platform is a full-stack application designed to provide hyper-personalized, adaptive learning experiences with a focus on Flow State Design.

## Core Principles

### 1. Flow State Design

The system transitions users from extrinsic motivation (gamification rewards) to intrinsic motivation (curiosity and joy of learning) by:

- Starting with full confetti animations and visual rewards
- Detecting flow state (5+ correct answers in quick succession)
- Gradually fading extrinsic rewards as flow state is achieved
- Maintaining story-driven narratives that leverage curiosity gaps

### 2. Dual-Track Adaptive Curriculum

Mathematics and ELA are completely decoupled to allow:

- 6th-grade Beast Academy level math for advanced reasoning
- 4th-grade Lexile level reading for remediation
- Independent mastery tracking per domain using BKT

### 3. Bayesian Knowledge Tracing (BKT)

Probabilistic model that tracks concept mastery:

```
P(L_n+1) = P(L_n | evidence) + (1 - P(L_n | evidence)) * P(T)

Where:
- P(L): Probability of knowing the concept
- P(T): Learning rate (0.3)
- P(G): Guess probability (0.25)
- P(S): Slip probability (0.1)
```

### 4. Retrieval-Augmented Generation (RAG)

AI content generation enhanced with user memory:

1. Query vector database for relevant past interactions
2. Inject context into LLM prompt
3. Generate personalized content with user's name and interests
4. Store interaction in vector DB for future reference

## Technology Stack

### Backend (NestJS/Node.js)

- **Framework**: NestJS (TypeScript-first microservices)
- **Runtime**: Node.js 18+
- **API Style**: RESTful with JSON

### Databases

#### PostgreSQL (Relational Data)

**Tables**:

- `user_profiles`: User information and learning levels
- `bkt_mastery`: Bayesian Knowledge Tracing mastery records
- `concepts`: Learning concept definitions
- `learning_sessions`: Active learning sessions

**Why PostgreSQL**: Strong consistency, ACID guarantees for user data and mastery tracking.

#### MongoDB (Document Store)

**Collections**:

- `gamification_states`: User XP, streaks, leagues
- `quests`: Available quests and challenges
- `user_quests`: User quest progress

**Why MongoDB**: High-throughput writes for gamification events, flexible schema for evolving features.

#### Pinecone (Vector Database)

**Purpose**: Store embeddings for user memories to power RAG.

**Data**:

- Conversation history
- Past misconceptions
- User preferences
- Achievement records

**Why Pinecone**: Specialized for similarity search on embeddings, low-latency queries.

### Message Broker (RabbitMQ)

**Purpose**: Asynchronous event processing for gamification.

**Event Types**:

- `correct_answer`: Triggers XP award and streak update
- `video_completed`: Awards video completion XP
- `quest_progress`: Updates quest completion

**Why RabbitMQ**: Reliable message delivery, prevents blocking on gamification updates.

### AI Integration (OpenAI)

**Models**:

- GPT-4o: Content generation and Socratic tutoring
- text-embedding-ada-002: Generate embeddings for RAG

**Prompt Engineering Techniques**:

- Persona Pattern: Define empathetic tutor persona
- Context Injection: Include user name, interests, past mistakes
- Socratic Method: Ask guiding questions instead of giving answers

### Frontend (React Native/Expo)

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Animation**: Lottie (JSON-based vector animations)
- **Video**: YouTube IFrame API

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Expo)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ HomeScreen   │  │ Learning     │  │ Progress     │      │
│  │              │  │ Screen       │  │ Screen       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────────┐
│                    NestJS Backend (API Gateway)             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │  Session   │ │  Content   │ │  Progress  │ │ Video    │ │
│  │  Service   │ │  Service   │ │  Service   │ │ Service  │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │Gamification│ │    User    │ │  BKT       │              │
│  │  Service   │ │  Service   │ │  Engine    │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │PostgreSQL│      │ MongoDB │      │RabbitMQ │
    │         │      │         │      │         │
    │User Data│      │Gamif.   │      │Events   │
    │BKT      │      │Data     │      │Queue    │
    └─────────┘      └─────────┘      └─────────┘
    
         ┌─────────────────┬─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │Pinecone │      │ OpenAI  │      │YouTube  │
    │         │      │         │      │  API    │
    │Vectors  │      │GPT-4o   │      │         │
    └─────────┘      └─────────┘      └─────────┘
```

## Data Flow

### 1. Starting a Learning Session

```
User → Frontend → POST /api/session/start
                     ↓
              Session Service
                     ↓
              BKT Engine (recommend concepts)
                     ↓
              Return session + concepts
```

### 2. Generating Content

```
User → Frontend → POST /api/content/generate
                     ↓
              Content Service
                     ↓
              Vector DB (query memories)
                     ↓
              OpenAI (generate with context)
                     ↓
              Vector DB (store generation)
                     ↓
              Return personalized question
```

### 3. Submitting Answer

```
User → Frontend → POST /api/progress/submit
                     ↓
              Progress Service
                     ↓
              BKT Engine (update mastery)
                     ↓
              Gamification Service (award XP)
                     ↓
              RabbitMQ (publish event)
                     ↓
              Return XP + confetti config
```

## Key Algorithms

### Bayesian Knowledge Tracing Update

```typescript
// P(L|correct) = P(correct|L) * P(L) / P(correct)
const P_correct_given_L = 1 - P_S; // 0.9
const P_correct_given_not_L = P_G; // 0.25
const P_correct = P_correct_given_L * P_L + P_correct_given_not_L * (1 - P_L);

P_L_given_correct = (P_correct_given_L * P_L) / P_correct;

// Apply learning
P_L_next = P_L_given_correct + (1 - P_L_given_correct) * P_T;
```

### Flow State Confetti Fade

```typescript
const FLOW_STATE_THRESHOLD = 5; // 5 correct in a row
const MAX_OPACITY = 1.0;
const MIN_OPACITY = 0.2;

if (streak < FLOW_STATE_THRESHOLD) {
  opacity = MAX_OPACITY;
} else {
  const fadeProgress = Math.min((streak - FLOW_STATE_THRESHOLD) / 10, 1.0);
  opacity = MAX_OPACITY - fadeProgress * (MAX_OPACITY - MIN_OPACITY);
}
```

### League Promotion/Demotion

```typescript
// Weekly cohort of 30 users
const COHORT_SIZE = 30;
const PROMOTION_ZONE = { Bronze: 10, Silver: 10, ... Diamond: 15 };
const DEMOTION_ZONE = 5;

// Top 10-15 get promoted
if (rank <= PROMOTION_ZONE[league] && league !== 'Diamond') {
  promote(user);
}

// Bottom 5 get demoted
if (rank >= COHORT_SIZE - DEMOTION_ZONE && league !== 'Bronze') {
  demote(user);
}
```

## Security Considerations

### API Security

- Input validation with class-validator
- SQL injection prevention via TypeORM parameterization
- NoSQL injection prevention via Mongoose
- Rate limiting on AI endpoints

### Video Verification Anti-Cheat

- Minimum watch duration (30 seconds)
- 90% completion threshold
- Playback speed check (max 1.2x)
- Duration sanity checks

### Data Privacy

- User data stored securely in PostgreSQL
- Embeddings in Pinecone are anonymized
- No PII in vector database metadata
- GDPR-compliant data deletion

## Performance Optimization

### Backend

- Connection pooling for databases
- RabbitMQ for async processing
- TypeORM query optimization
- MongoDB indexing on user_id and timestamps

### Frontend

- Lottie for GPU-accelerated animations
- React.memo for component optimization
- Lazy loading for screens
- Image optimization with Expo

### AI

- Caching of embeddings
- Parallel processing of RAG queries
- Streaming responses for long content
- Token limit management

## Monitoring & Observability

### Metrics to Track

- Session completion rate
- Average time per question
- BKT mastery progression
- Flow state achievement rate
- Streak retention rate
- API response times

### Logging

- Structured logging with context
- Error tracking with stack traces
- User action audit logs
- AI generation logs for debugging

## Scalability Considerations

### Horizontal Scaling

- Stateless NestJS services
- Load balancer for API instances
- MongoDB replica sets
- PostgreSQL read replicas

### Vertical Scaling

- Optimize BKT calculations
- Batch vector DB queries
- Cache frequent concept lookups
- Database query optimization

## Future Enhancements

1. **Real-time Collaboration**: Multi-player learning sessions
2. **Voice Interaction**: Speech-to-text for answers
3. **Adaptive Difficulty**: Dynamic difficulty adjustment within session
4. **Parent Dashboard**: Progress tracking for guardians
5. **Offline Mode**: Sync when reconnected
6. **Multi-language Support**: Internationalization
7. **Advanced Analytics**: Predictive modeling for at-risk students

## License

Proprietary - All rights reserved
