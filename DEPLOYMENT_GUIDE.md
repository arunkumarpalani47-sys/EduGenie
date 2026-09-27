# 🚀 EduGenie Deployment & 24/7 Zero-Sleep Guide

This guide walks you through deploying **EduGenie** to production with:
- **Frontend** on **Vercel**
- **Backend** on **Render** (Node.js)
- **24/7 Continuous Uptime** (Never sleeps, 0-second cold starts)

---

## 📋 Architecture Overview

| Component | Platform | Configuration File |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | [`frontend/vercel.json`](./frontend/vercel.json) |
| **Backend** | [Render](https://render.com) | [`render.yaml`](./render.yaml) & [`backend/src/server.js`](./backend/src/server.js) |
| **24/7 Keep-Alive** | GitHub Actions + Cron-job.org | [`.github/workflows/keepalive.yml`](./.github/workflows/keepalive.yml) |

---

## Part 1: Push Code to GitHub

If your project is not yet connected to a GitHub repository:

```bash
git init
git add .
git commit -m "feat: complete edugenie ready for vercel and render deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## Part 2: Deploy Backend to Render

1. Log in to [Render.com](https://render.com) (sign up with GitHub).
2. Click **"New +"** in the top right → Select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and select your EduGenie repository.
4. Fill in the service configuration:
   - **Name:** `edugenie-api` (or your preferred name)
   - **Region:** Choose the region closest to you (e.g., `Singapore`, `Frankfurt`, or `Ohio`)
   - **Root Directory:** `backend` ⚠️ *(Crucial!)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Scroll down to **"Environment Variables"** and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | (Render also injects this automatically) |
| `GEMINI_API_KEY` | `your_gemini_api_key` | From [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Ultra-fast streaming model |
| `CLIENT_URL` | `https://your-app.vercel.app` | (Update after creating Vercel app, or leave as `*`) |
| `MONGO_URI` | `mongodb+srv://...` | Optional: Your free MongoDB Atlas connection string |

6. Click **"Create Web Service"**.
7. Wait ~2 minutes for the build to finish. Once live, Render gives you a public URL like:
   `https://edugenie-api.onrender.com`
8. Verify it works by opening in your browser:
   `https://edugenie-api.onrender.com/api/health`
   You should see: `{"status":"ok","service":"EduGenie API","version":"1.0.0"}`

---

## Part 3: Deploy Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com) (sign up with GitHub).
2. Click **"Add New..."** → **"Project"**.
3. Import your EduGenie GitHub repository.
4. In the **Configure Project** screen:
   - **Project Name:** `edugenie` (or any custom name)
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** Click **"Edit"** → Select `frontend` ⚠️ *(Crucial!)*
5. Open the **"Environment Variables"** section and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://edugenie-api.onrender.com` *(your Render backend URL from Part 2)* |

6. Click **"Deploy"**.
7. In ~30 seconds, Vercel will give you a live production URL:
   `https://edugenie.vercel.app`
8. *(Optional)* Go back to your Render backend dashboard → **Environment Variables** → update `CLIENT_URL` with your new Vercel domain (`https://edugenie.vercel.app`).

---

## Part 4: Keep Render Awake 24/7 (Zero Sleep / No Cold Starts)

Render Free Tier puts services to sleep after 15 minutes of zero traffic. We have configured **3 foolproof layers** to prevent this:

### 🛡️ Layer 1: Internal Self-Ping (Already Built In)
- Inside [`backend/src/services/keepAlive.js`](./backend/src/services/keepAlive.js), EduGenie automatically detects `RENDER_EXTERNAL_URL` and sends a ping to `/api/health` every 14 minutes.

### 🛡️ Layer 2: Free GitHub Actions Keep-Alive (Automated)
We created [`.github/workflows/keepalive.yml`](./.github/workflows/keepalive.yml). To activate:
1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
2. Click **"New repository secret"**.
3. Name: `RENDER_BACKEND_URL`
4. Value: `https://edugenie-api.onrender.com` (your Render URL)
5. GitHub will now automatically send an external ping every 12 minutes 24/7 for free!

### 🛡️ Layer 3: Free Web Monitor (Recommended Extra Safety)
Use a free web monitor like [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com):
1. Sign up for a free account at [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com).
2. Create a new monitor / cron job:
   - **URL:** `https://edugenie-api.onrender.com/api/health`
   - **Interval:** Every 10 minutes
3. Save it. This guarantees external HTTP traffic hits Render continuously, keeping your backend blazing fast around the clock!

---

## ✅ Deployment Checklist

- [ ] Backend runs on port and binds to `0.0.0.0`
- [ ] Vercel SPA rewrite rules in [`frontend/vercel.json`](./frontend/vercel.json)
- [ ] `VITE_API_URL` set in Vercel project settings
- [ ] Render `GEMINI_API_KEY` set in Render environment variables
- [ ] Keep-alive monitor configured for `/api/health`
