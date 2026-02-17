# Adaptive Learning Platform - Setup Guide

Complete setup instructions for the adaptive learning platform.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- MongoDB 6+
- Docker and Docker Compose (recommended)
- Expo CLI (for mobile development)

## Quick Start with Docker

The easiest way to get started is using Docker Compose:

```bash
# Start all services (PostgreSQL, MongoDB, RabbitMQ)
docker-compose up -d

# Verify services are running
docker-compose ps
```

## Backend Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=adaptive_learning

MONGODB_URI=mongodb://admin:admin@localhost:27017/gamification?authSource=admin

# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# AI Service Configuration (Required for personalized content)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Vector Database Configuration (Optional, but recommended)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=adaptive-learning-memory

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 3. Seed the Database

```bash
# Run migrations and seed initial concept data
npm run build
node dist/seed/seed.js
```

### 4. Start the Backend

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Note**: For iOS/Android simulators, you may need to use your computer's local IP instead of `localhost`.

### 3. Start the Frontend

```bash
# Start Expo dev server
npx expo start

# Run on specific platform
npx expo start --ios      # iOS Simulator
npx expo start --android  # Android Emulator
npx expo start --web      # Web Browser
```

## API Keys Setup

### OpenAI API Key (Required)

1. Go to https://platform.openai.com/
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to `backend/.env` as `OPENAI_API_KEY`

### Pinecone API Key (Optional, for enhanced RAG)

1. Go to https://www.pinecone.io/
2. Create a free account
3. Create a new index named `adaptive-learning-memory`
4. Get your API key from the dashboard
5. Add it to `backend/.env` as `PINECONE_API_KEY`

If you don't configure Pinecone, the app will still work but without long-term memory storage.

## Development Workflow

### Running the Full Stack

From the root directory:

```bash
# Terminal 1: Start databases
docker-compose up

# Terminal 2: Start backend
cd backend && npm run start:dev

# Terminal 3: Start frontend
cd frontend && npx expo start
```

### Creating a New User

The frontend automatically creates a demo user on first launch. To create additional users:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ashi",
    "thematic_interests": ["gymnastics", "cute puppies"],
    "math_level": 6,
    "ela_level": 4
  }'
```

## Testing the API

### Start a Learning Session

```bash
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "session_duration_minutes": 15,
    "visual_timer_type": "puppy"
  }'
```

### Generate Content

```bash
curl -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "concept_id": "math_6_geometry_3d"
  }'
```

### Submit Progress

```bash
curl -X POST http://localhost:3000/api/progress/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "session_id": "session-id",
    "content_id": "content-id",
    "concept_id": "math_6_geometry_3d",
    "is_correct": true,
    "time_taken_seconds": 45,
    "answer_given": "42"
  }'
```

## Architecture Overview

### Backend Services

1. **Session Service**: Manages learning sessions with Pomodoro timers
2. **Content Service**: AI-powered content generation with RAG
3. **Progress Service**: Bayesian Knowledge Tracing (BKT) engine
4. **Gamification Service**: XP, streaks, leagues, quests
5. **Video Service**: YouTube verification with anti-cheat
6. **User Service**: User profile management

### Databases

- **PostgreSQL**: User profiles, BKT mastery, concepts, sessions
- **MongoDB**: High-throughput gamification data
- **Pinecone**: Vector embeddings for RAG memory
- **RabbitMQ**: Async event processing

### Frontend Components

- **HomeScreen**: Dashboard with streaks, XP, and session start
- **LearningScreen**: Question interface with visual timer
- **ConfettiAnimation**: Flow-state-aware rewards
- **VisualTimer**: Anxiety-free Pomodoro timer
- **QuestionCard**: Personalized question rendering

## Troubleshooting

### Backend won't start

- Check that PostgreSQL and MongoDB are running
- Verify connection strings in `.env`
- Ensure ports 3000, 5432, 27017, 5672 are available

### Frontend can't connect to API

- Check `EXPO_PUBLIC_API_URL` in frontend `.env`
- For mobile simulators, use your computer's local IP instead of `localhost`
- Verify backend is running and accessible

### OpenAI API errors

- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure the model name is correct (gpt-4o or gpt-3.5-turbo)

### Database connection errors

- If using Docker: `docker-compose down && docker-compose up -d`
- Check database credentials in `.env`
- Verify databases are accepting connections

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in `.env`
2. Configure production database URLs
3. Build: `npm run build`
4. Start: `npm run start:prod`

### Frontend

1. Update API URL to production endpoint
2. Build for platform:
   - iOS: `eas build --platform ios`
   - Android: `eas build --platform android`
   - Web: `npx expo export:web`

## License

Proprietary - All rights reserved
