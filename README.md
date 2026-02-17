# Adaptive Learning Platform

> **Status**: ✅ COMPLETE - Production Ready

A hyper-personalized, adaptive learning platform built with Flow State Design principles to transition users from extrinsic to intrinsic motivation.

**Target User**: 5th-grade student (Ashi) with 6th-grade math aptitude and 4th-grade reading level, interested in gymnastics and cute puppies.

## Quick Start

```bash
# 1. Start databases with Docker
docker-compose up -d

# 2. Install and start backend
cd backend && npm install
npm run start:dev

# 3. Install and start frontend (new terminal)
cd frontend && npm install
npx expo start
```

See [SETUP.md](SETUP.md) for detailed instructions.

## Project Overview

This platform provides a scalable, end-to-end adaptive learning experience tailored to individual student needs, featuring:

- **Dual-Track Adaptive Curriculum**: Separate mastery tracking for Math and ELA using Bayesian Knowledge Tracing (BKT)
- **AI-Powered Content Generation**: Retrieval-Augmented Generation (RAG) with personalized, Socratic tutoring
- **Progressive Gamification**: Smart reward system that fades extrinsic rewards as users enter flow states
- **Neuroscience-Based Session Management**: Pomodoro-style focus blocks optimized for pre-teens
- **Video Learning Integration**: Khan Academy content with anti-cheat verification

## Technology Stack

### Frontend
- **React Native (Expo)**: Cross-platform (iOS/Android/Web)
- **Lottie**: High-performance JSON animations
- **YouTube IFrame API**: Embedded video content

### Backend
- **NestJS**: TypeScript-first microservices architecture
- **Node.js**: Runtime environment
- **PostgreSQL**: User profiles and curriculum mapping
- **MongoDB**: High-throughput gamification data
- **Pinecone/Chroma**: Vector database for LLM memory
- **RabbitMQ**: Message broker for event-driven architecture
- **OpenAI GPT-4o / Anthropic Claude**: AI content generation

## Project Structure

```
/workspace
├── backend/          # NestJS microservices
├── frontend/         # React Native Expo app
└── shared/           # Shared types and utilities
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Docker (for RabbitMQ)

### Installation

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npx expo start
```

## Architecture

### Microservices
1. **Session Service**: Manages learning sessions and timers
2. **Content Service**: AI-powered content generation with RAG
3. **Progress Service**: BKT engine and mastery tracking
4. **Gamification Service**: XP, streaks, leagues, and quests
5. **Video Service**: YouTube integration and verification

### Database Schemas

#### PostgreSQL
- `UserProfile`: User information and learning levels
- `BKTMastery`: Bayesian Knowledge Tracing data

#### MongoDB
- `GamificationState`: Streaks, XP, leagues

#### Vector DB
- Conversation history and user memory for RAG

## Key Features

### Bayesian Knowledge Tracing
Tracks mastery probability for each concept, ensuring optimal challenge level.

### Hyper-Personalization
- User's name injected into all problems
- Content based on personal interests (gymnastics, puppies)
- Adaptive difficulty based on separate Math and ELA levels

### Flow State Design
- Confetti animations that fade as user achieves flow
- Story-driven problems with curiosity gaps
- Socratic questioning instead of direct answers

### Gamification System
- Daily streaks with streak freezes
- 10-tier league system (Bronze → Diamond)
- Time-bound quests and challenges
- XP rewards for progress

## API Endpoints

- `POST /api/session/start`: Initialize learning session
- `POST /api/content/generate`: Generate personalized content
- `POST /api/progress/submit`: Submit answer and update mastery
- `POST /api/video/verify`: Verify video completion

## License

Proprietary - All rights reserved
