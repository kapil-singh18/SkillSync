# SkillSync — Production Deployment Guide

This guide provides end-to-end instructions for deploying the **SkillSync** MERN application to production using **MongoDB Atlas**, **Render** (Backend), and **Vercel** (Frontend).

---

## 1. Architecture Overview

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Zustand + Lucide Icons (Hosted on Vercel)
- **Backend**: Node.js + Express + Socket.io + Multer (Hosted on Render)
- **Database**: MongoDB Atlas
- **AI Gateway**: Google Gemini 1.5 Flash (`@google/generative-ai`)

---

## 2. Required Environment Variables

### Backend (`server/`)

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `NODE_ENV` | Environment mode (`development` or `production`) | `production` |
| `PORT` | Listening port (injected automatically by Render) | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/skillsync?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `a_strong_random_64_character_hex_or_alphanumeric_string` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `GEMINI_API_KEY` | Google AI Studio API key for Gemini 1.5 Flash | `AIzaSy...` |
| `CLIENT_URL` | Deployed Frontend URL for CORS & Socket.io authorization | `https://skillsync.vercel.app` |

### Frontend (`client/`)

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `VITE_API_URL` | Base API URL pointing to the deployed backend `/api` | `https://skillsync-api.onrender.com/api` |

---

## 3. Step-by-Step Deployment

### Step A: Set up Database (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a shared (M0 Free Tier) cluster.
3. In **Database Access**, create a database user with read/write privileges.
4. In **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render's dynamic IPs.
5. Click **Connect** → **Drivers** (Node.js) and copy the connection string (`MONGO_URI`).

### Step B: Deploy Backend to Render
1. Push your repository to GitHub.
2. Log in to [Render](https://render.com) and click **New** → **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `skillsync-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: *(your MongoDB connection string)*
   - `JWT_SECRET`: *(your secure 64-char string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `GEMINI_API_KEY`: *(your Google Gemini API key)*
   - `CLIENT_URL`: `https://skillsync.vercel.app` *(update once frontend is created)*
6. Click **Deploy Web Service**.
7. Once deployed, run the initial badge seed script via Render's Web Shell (or locally pointed to Atlas):
   ```bash
   node utils/seedBadges.js
   ```

### Step C: Deploy Frontend to Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://skillsync-api.onrender.com/api` *(your Render backend URL + `/api`)*
5. Click **Deploy**.
6. After deployment, copy your Vercel production URL (e.g., `https://skillsync.vercel.app`) and update the `CLIENT_URL` environment variable on your Render backend.

---

## 4. Security Hardening Summary

The production server includes the following layers of security:

1. **HTTP Security Headers (`helmet`)**: Configures secure HTTP headers (XSS filter, HSTS, frameguard, etc.).
2. **Brute Force Protection (`express-rate-limit`)**:
   - General API limiter: 100 requests per 15 minutes per IP.
   - Strict Auth limiter: 5 attempts per 15 minutes on `/api/auth/login` and `/api/auth/register`.
3. **NoSQL Injection Defense (`express-mongo-sanitize`)**: Strips prohibited characters (`$` and `.`) from user inputs.
4. **HTTP Parameter Pollution Prevention (`hpp`)**: Prevents pollution attacks on query parameters.
5. **CORS Origin Locking**: Restricts API and WebSockets requests to `CLIENT_URL`.
6. **Input Validation (`express-validator`)**: Comprehensive validation rules and sanitization across all mutating endpoints.
7. **Secure Error Handling**: Centralized error middleware with no stack traces or internal details leaked in production (`NODE_ENV=production`).
8. **Client Crash Protection**: React `ErrorBoundary` fallback UI with retry capability.

---

## 5. Verification & Health Check

- **Health Check Endpoint**: `GET /api/health`
  - Returns `{ status: "ok", timestamp: "..." }`
- **Frontend 404 Route**: Handled cleanly with dedicated `<NotFound />` component.
