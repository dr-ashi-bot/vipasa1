# Adaptive Learning Platform - Frontend

React Native Expo application for the adaptive learning platform.

## Features

- **Cross-Platform**: Runs on iOS, Android, and Web
- **Hyper-Personalized Learning**: AI-generated content tailored to user interests
- **Flow State Design**: Adaptive gamification that fades as user achieves flow
- **Visual Timers**: Engaging Pomodoro-style timers with cute animations
- **Gamification**: Streaks, XP, leagues, and quests
- **Socratic Feedback**: AI tutor provides guiding questions, not answers

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator (optional)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update `EXPO_PUBLIC_API_URL` to point to your backend API.

### Running the App

#### Development Mode

```bash
# Start Expo dev server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android

# Run on Web
npx expo start --web
```

## Project Structure

```
src/
├── screens/          # Main app screens
│   ├── HomeScreen.tsx
│   └── LearningScreen.tsx
├── components/       # Reusable components
│   ├── ConfettiAnimation.tsx
│   ├── VisualTimer.tsx
│   ├── StreakDisplay.tsx
│   ├── XPDisplay.tsx
│   └── QuestionCard.tsx
├── services/         # API services
│   └── api.ts
├── types/            # TypeScript types
│   └── index.ts
└── assets/           # Static assets
    └── lottie/       # Lottie animations
```

## Components

### ConfettiAnimation

Full-screen confetti animation that fades based on flow state. Uses Lottie for smooth, performant animations.

### VisualTimer

Pomodoro-style timer with visual progress (puppy or gymnast). No anxiety-inducing countdown numbers.

### StreakDisplay

Shows current streak with fire emoji and streak freeze management.

### XPDisplay

Displays total XP, weekly XP, and current league with color-coded badges.

### QuestionCard

Renders personalized questions with narrative context, supports both multiple choice and free response.

## API Integration

The app communicates with the NestJS backend via REST APIs:

- **Session API**: Start/manage learning sessions
- **Content API**: Generate personalized questions and Socratic feedback
- **Progress API**: Submit answers and track mastery
- **Video API**: Verify video completion
- **Gamification API**: Track XP, streaks, and leagues
- **User API**: Manage user profiles

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

### Web

```bash
npx expo export:web
```

## License

Proprietary - All rights reserved
