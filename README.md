# SkillSync

> **Learn together. Grow faster.**

A peer learning and collaboration platform for students and professionals. Built as a final-year project.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Client** | React (Vite), TailwindCSS v4, React Router, Zustand, Axios, Lucide React |
| **Server** | Node.js, Express, MongoDB (Mongoose) |
| **AI** | Google Gemini (via `@google/generative-ai`) |

## Project Structure

```
SkillSync/
├── client/          # React frontend (Vite)
└── server/          # Express API
```

## Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas URI)
- (Optional) Gemini API key for AI features

---

### 1. Server

```bash
cd server

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, GEMINI_API_KEY, CLIENT_URL

# Run in development mode (nodemon)
npm run dev

# Or start in production
npm start
```

The server runs on `http://localhost:5000` by default.

**Health check:** `GET /api/health` → `{ success: true, message: "Server is healthy" }`

---

### 2. Client

```bash
cd client

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set VITE_API_URL (default: http://localhost:5000/api)

# Run development server
npm run dev
```

The client runs on `http://localhost:5173` by default.

---

## Module Status

| Module | Status | Description |
|---|---|---|
| **Module 1** | ✅ Done | Scaffolding, design system, app shell |
| Module 2 | 🔜 Planned | Authentication (JWT) |
| Module 3 | 🔜 Planned | User profiles & social graph |
| Module 4 | 🔜 Planned | Projects & collaboration |
| Module 5 | 🔜 Planned | AI-powered features |

## Design System

- **Font:** Plus Jakarta Sans (400/500/600/700)
- **Color tokens:** CSS custom properties mapped to Tailwind — `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `bg-accent`, etc.
- **Themes:** Dark (default) + Light, toggled via `data-theme` on `<html>`, persisted in `localStorage`
- **Shape:** `rounded-xl` (cards), `rounded-lg` (buttons/inputs), `rounded-full` (avatars/pills)
