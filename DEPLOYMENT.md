# Deployment Guide — Fully Functional Web App

Follow these steps to get a live URL in ~10 minutes.

## Fastest Path to Live URL (~5 min)

**No CLI needed** — use the Vercel dashboard:

1. **Deploy frontend**: Go to https://vercel.com/new → Import `dr-ashi-bot/vipasa1` → Set **Root Directory** to `frontend` → Deploy. You'll get a URL like `https://vipasa1-xxx.vercel.app`.

2. **Deploy backend**: Go to https://render.com → New Web Service → Connect `dr-ashi-bot/vipasa1` → Root: `backend` → Add `DATABASE_URL` (Neon) and `MONGO_URI` (Atlas) → Deploy.

3. **Connect them**: In Vercel project → Settings → Environment Variables → Add `EXPO_PUBLIC_API_URL` = your Render URL → Redeploy.

4. **Done**: Open your Vercel URL — you have a working app.

## Prerequisites

- GitHub account (repo: https://github.com/dr-ashi-bot/vipasa1)
- Vercel account (free): https://vercel.com/signup
- Render account (free): https://render.com/register
- Neon account (free Postgres): https://neon.tech
- MongoDB Atlas account (free): https://www.mongodb.com/cloud/atlas/register

---

## Step 1: Create Databases (5 min)

### PostgreSQL (Neon)
1. Go to https://console.neon.tech
2. Create a project → copy the **connection string** (Connection pooling recommended)
3. Format: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

### MongoDB (Atlas)
1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Database Access → Add user (save password)
4. Network Access → Add IP `0.0.0.0` (allow all for Render)
5. Connect → Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

---

## Step 2: Deploy Backend (Render)

1. Go to https://dashboard.render.com
2. **New** → **Web Service**
3. Connect repository: `dr-ashi-bot/vipasa1`
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: Free

5. **Environment Variables** (add these):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Full Neon connection string (e.g. `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`) |
| `MONGO_URI` | Full MongoDB Atlas connection string |
| `NODE_ENV` | `production` |

*Or use individual PG_* vars if you prefer.*

6. Click **Create Web Service**
7. Wait for deploy (~3 min)
8. Copy your backend URL: `https://your-app.onrender.com`

---

## Step 3: Deploy Frontend (Vercel or Netlify)

### Option A: Vercel
1. Go to https://vercel.com/new
2. Import repository: `dr-ashi-bot/vipasa1`
3. Settings:
   - **Root Directory**: `frontend` (click Edit, set to `frontend`)
   - **Framework Preset**: Other
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   - `EXPO_PUBLIC_API_URL` = your Render backend URL (e.g. `https://your-app.onrender.com`)

5. Click **Deploy**
6. Copy your frontend URL: `https://your-project.vercel.app`

### Option B: Netlify
1. Go to https://app.netlify.com/start
2. Import from Git → `dr-ashi-bot/vipasa1`
3. Base directory: `frontend`
4. Build command & publish directory are auto-detected from `netlify.toml`
5. Add env var: `EXPO_PUBLIC_API_URL` = your Render backend URL
6. Deploy

---

## Step 4: Verify

1. Open your Vercel URL
2. Click **Start Session** — it should load problems from the backend
3. Solve a problem — you should see confetti and XP update

---

## Quick Links After Deploy

- **Frontend**: `https://[your-project].vercel.app`
- **Backend API**: `https://[your-app].onrender.com`
- **Health check**: `https://[your-app].onrender.com` (root)

---

## Troubleshooting

**CORS errors**: Backend has `app.enableCors()` — should work. If not, add your Vercel domain to CORS in `backend/src/main.ts`.

**API connection refused**: Ensure `EXPO_PUBLIC_API_URL` in Vercel matches your Render URL exactly (no trailing slash).

**Database connection failed**: Double-check Neon/MongoDB connection strings. For Neon, use the pooled connection string.
