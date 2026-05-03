# VoteWise — Indian Election Education Assistant

> 🗳️ An interactive platform for civic education about Indian elections, powered by Google Gemini AI.

**VoteWise** helps Indian citizens learn about the electoral process, verify election-related claims, explore institutions, and prepare for voting — all through an intuitive, accessible web application.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│  React 18 + TypeScript + Vite + TailwindCSS                     │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────────┐ │
│  │ Timeline │ Register │ Glossary │ MythCheck│  Institutions  │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────────┘ │
│  ┌─────────────────┬──────────────┬───────────────────────────┐ │
│  │   ChatBubble    │  QuizModal   │   LanguageToggle (EN/HI)  │ │
│  └─────────────────┴──────────────┴───────────────────────────┘ │
│                     Firebase Hosting                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                    Cloud Run (FastAPI)                           │
│  ┌──────────┬──────────┬──────────────┬──────────────────────┐  │
│  │  /api/qa │ /api/quiz│ /api/mythcheck│  /api/translate      │  │
│  └────┬─────┴────┬─────┴──────┬───────┴──────────┬───────────┘  │
│       │          │            │                  │               │
│  ┌────▼──────────▼────────────▼──┐  ┌────────────▼────────────┐ │
│  │   GeminiService               │  │  TranslationService     │ │
│  │   (Gemini 1.5 Flash)          │  │  (Cloud Translation)    │ │
│  └───────────┬───────────────────┘  └─────────────────────────┘ │
│              │                                                   │
│  ┌───────────▼──────────┐  ┌──────────────────────────────────┐ │
│  │  CacheService (LRU)  │  │  Cloud Logging → Cloud Monitoring│ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                  │
│  Secret Manager → GEMINI_API_KEY (env var injection)             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool         | Version  | Install                                         |
|-------------|----------|--------------------------------------------------|
| Node.js     | 18+      | https://nodejs.org                               |
| Python      | 3.11+    | https://www.python.org                           |
| gcloud CLI  | Latest   | https://cloud.google.com/sdk/docs/install        |
| Firebase CLI| Latest   | `npm install -g firebase-tools`                  |
| Gemini Key  | —        | https://aistudio.google.com/apikey               |

---

## Local Development

### Backend

```bash
cd votewise/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the development server
uvicorn main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend

```bash
cd votewise/frontend

# Install dependencies
npm install

# Set API URL (points to local backend)
echo "VITE_API_URL=http://localhost:8000" > .env

# Run the development server
npm run dev
# App available at http://localhost:5173
```

---

## Running Tests

### Backend Tests

```bash
cd votewise/backend
source venv/bin/activate
pytest --cov=. --cov-report=term-missing -v
```

### Frontend Tests

```bash
cd votewise/frontend
npm run test
# Or with coverage:
npx vitest run --coverage --reporter=verbose
```

---

## Deployment

### Automated (via Antigravity MCP)

1. Ensure `gcloud` and `firebase` CLI are authenticated
2. Backend deploys to Cloud Run via Cloud Run MCP
3. Frontend deploys to Firebase Hosting via Firebase MCP
4. Run `setup.sh` to configure Secret Manager

### Manual Deployment

#### Backend → Cloud Run

```bash
cd votewise/backend
gcloud run deploy votewise-backend \
  --source . \
  --region asia-south1 \
  --memory 512Mi \
  --concurrency 80 \
  --min-instances 1 \
  --allow-unauthenticated
```

#### Frontend → Firebase Hosting

```bash
cd votewise/frontend
echo "VITE_API_URL=<YOUR_CLOUD_RUN_URL>" > .env
npm run build
firebase deploy --only hosting
```

### setup.sh — Secret Manager Configuration

```bash
# Set your project ID
export PROJECT_ID=your-gcp-project-id

# Run the setup script
./setup.sh
```

This script:
1. Enables the Secret Manager API
2. Creates a secret for `GEMINI_API_KEY`
3. Grants the Cloud Run service account access
4. Binds the secret as an environment variable

---

## Google Cloud Services Used

| #  | Service                | Purpose                                              |
|----|------------------------|------------------------------------------------------|
| 1  | **Cloud Run**          | Hosts the FastAPI backend as a container              |
| 2  | **Firebase Hosting**   | Hosts the React frontend as a static site             |
| 3  | **Gemini 1.5 Flash**   | Powers Q&A, quiz generation, and myth fact-checking    |
| 4  | **Secret Manager**     | Securely stores and injects the Gemini API key        |
| 5  | **Cloud Translation**  | English ↔ Hindi translation via Translation API v2    |
| 6  | **Cloud Logging**      | Structured logging from FastAPI → Cloud Monitoring    |
| 7  | **Cloud Monitoring**   | Auto-integrates with Cloud Logging for observability  |

---

## Features

| Feature            | Description                                                |
|-------------------|------------------------------------------------------------|
| **Timeline**       | 7-stage election process with interactive cards             |
| **Registration**   | 5-step voter registration guide with AI explanations        |
| **Parties**        | Factual party comparison (static data, no AI)              |
| **Glossary**       | 40+ searchable terms with cross-linking and AI explanations |
| **Myth Check**     | AI fact-checker with verdict badges and confidence scores    |
| **Institutions**   | 6 electoral institutions with quiz feature                  |
| **Chat Assistant** | Floating AI chatbot for election questions                  |
| **Language Toggle**| English ↔ Hindi translation via Cloud Translation           |

---

## Political Neutrality Statement

> **VoteWise is committed to political neutrality.**
>
> This application is designed exclusively for **civic education** and does **not**:
> - Endorse, rank, or evaluate any political party or candidate
> - Generate AI opinions about political parties
> - Display partisan content or biased information
>
> The Political Parties comparison page uses only **publicly available, factual data** from official sources. No AI-generated content is used in party comparisons.
>
> All AI features (Q&A, Quiz, Myth Check) are bound by system prompts that enforce factual, neutral responses based on ECI guidelines, the Indian Constitution, and verified electoral law.

---

## License

MIT © VoteWise Contributors
