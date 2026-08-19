# SkillSync

SkillSync is an AI-powered peer learning platform that intelligently connects students and mentors based on complementary skills, learning goals, and availability — enabling structured, meaningful knowledge exchange within academic communities.

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI)
- Google Gemini API key (for AI features in later phases)

### Server
```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev            # starts on PORT (default 5000)
```

### Client
```bash
cd client
cp .env.example .env   # fill in VITE_API_URL
npm install
npm run dev            # starts on http://localhost:5173
```
