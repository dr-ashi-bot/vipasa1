# Deploy VIPASA Web to Vercel

## Prerequisites
- Node 20+
- Vercel account
- Vercel CLI access (the deploy script uses `npx vercel`)

## Local run (immediate)
```bash
npm install
npm run start:web
```
Open `http://localhost:3000`.

## Deploy
```bash
npm run deploy:web:vercel
```

This deploys `apps/web` as a standalone Next.js app with built-in API routes:
- `POST /api/session/start`
- `POST /api/content/generate`
- `POST /api/progress/submit`
- `POST /api/video/verify`
