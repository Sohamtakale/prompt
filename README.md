# VoteWise 🗳️

> An interactive Indian election education assistant — built for every citizen.

VoteWise helps Indian citizens understand the election process through guided walkthroughs, interactive timelines, myth-busting, quizzes, and a conversational AI assistant. Built on Google Cloud and powered by Gemini 1.5 Flash.

---

## Live Demo

| Service | URL |
|---|---|
| **Frontend** | [https://promptwars-495017.web.app](https://promptwars-495017.web.app) |
| **Backend API** | [https://votewise-backend-870341326747.asia-south1.run.app](https://votewise-backend-870341326747.asia-south1.run.app) |
| **API Health** | `https://votewise-backend-870341326747.asia-south1.run.app/health` |

---

## Features

### 1. Election Timeline
Interactive visual walkthrough of all 7 stages of an Indian general election — from announcement to new government formation. Each stage is clickable and opens a Gemini-powered explanation. Covers: Election Announcement, Model Code of Conduct, Nominations, Campaigning, Voting Day, Counting, and Results.

### 2. Voter Registration Guide
Step-by-step stepper UI that walks citizens through the complete voter registration process: eligibility check → Form 6 submission → documents required → finding your polling booth → verifying your name on the voter list. Supports English and Hindi via Google Cloud Translation API.

### 3. Candidate Comparison
Side-by-side comparison cards for major national parties with factual, ECI-sourced information — party symbol, alliance, seat history, and official manifesto links. Filterable by state. No AI-generated opinions on candidates or parties — strictly factual.

### 4. Election Glossary
Searchable A–Z glossary of 40+ election terms including EVM, VVPAT, MCC, EPIC, Returning Officer, Delimitation, Postal Ballot, and more. Terms cross-link to each other. Gemini provides extended explanations on demand.

### 5. Myth vs Fact Checker
Users submit a claim about Indian elections and Gemini returns a structured verdict — TRUE, FALSE, PARTIALLY TRUE, or UNVERIFIABLE — along with a factual explanation citing ECI guidelines, the Representation of the People Act 1951, or the Indian Constitution. Confidence score shown as an accessible progress bar.

### 6. Institutions Explainer
Card-based explainer for 6 key electoral institutions: Election Commission of India, Supreme Court of India, President of India, Lok Sabha Secretariat, Rajya Sabha Secretariat, and State Election Commissions. Each card includes constitutional basis, key powers, and a "Quiz me" button.

### 7. Conversational Q&A
Persistent floating chat assistant available across all pages. Maintains conversation history. Answers only election-related questions and redirects off-topic queries.

### 8. Quiz Mode
Gemini-generated multiple choice questions on any election topic. 4 options per question, instant feedback with explanation, score summary at the end.

### 9. Google Authentication
Sign in with Google account via Firebase Authentication. User quiz history and myth check history saved per account in Firestore.

---

## Google Cloud Services

| Service | Purpose |
|---|---|
| **Gemini 1.5 Flash** | Conversational Q&A, quiz generation, myth verdict, glossary explanations |
| **Cloud Run** | Hosts the FastAPI backend container, auto-scales, asia-south1 region |
| **Firebase Hosting** | Serves the React SPA via global CDN with HTTPS |
| **Firebase Authentication** | Google Sign-In for user accounts |
| **Firestore** | Stores quiz results and myth check history per user |
| **Firebase Analytics** | Tracks feature usage (timeline views, quizzes completed, myths checked) |
| **Secret Manager** | Stores GEMINI_API_KEY securely, injected into Cloud Run at runtime |
| **Cloud Translation API** | Translates UI content between English and Hindi on demand |
| **Cloud Logging** | Structured JSON logs from FastAPI auto-integrated with Cloud Monitoring |
| **Artifact Registry** | Stores Docker images at asia-south1-docker.pkg.dev/promptwars-495017/votewise |
| **Cloud Build** | Builds Docker images as part of the deployment pipeline |

**Total: 11 Google Cloud services**

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER BROWSER                        │
│              React 18 + TypeScript + Vite               │
│                  Firebase Hosting (CDN)                 │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  CLOUD RUN (asia-south1)                 │
│               FastAPI + Python 3.11                     │
│   /api/qa  /api/quiz  /api/mythcheck  /api/translate    │
│   /api/history/quiz   /api/history/myths                │
│              Rate limited: 30 req/min/IP                │
└────┬──────────────┬───────────────┬─────────────────────┘
     │              │               │
     ▼              ▼               ▼
┌─────────┐  ┌──────────┐  ┌──────────────┐
│ Gemini  │  │Firestore │  │  Translation │
│1.5 Flash│  │    DB    │  │     API      │
└─────────┘  └──────────┘  └──────────────┘
     │
     ▼
┌─────────────────┐
│ Secret Manager  │
│ GEMINI_API_KEY  │
└─────────────────┘
```

---

## Tech Stack

**Frontend**
- React 18 with TypeScript (strict mode)
- Vite for build tooling
- TailwindCSS for styling
- React Router v6 with lazy-loaded routes
- Firebase SDK (Auth + Analytics + Firestore)

**Backend**
- FastAPI (Python 3.11)
- Pydantic v2 for request/response validation
- google-genai SDK for Gemini
- google-cloud-translate for Translation API
- google-cloud-logging for structured logs
- firebase-admin for token verification
- slowapi for rate limiting

---

## Project Structure

```
votewise/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, middleware, rate limiting
│   ├── routers/
│   │   ├── qa.py                  # POST /api/qa
│   │   ├── quiz.py                # POST /api/quiz
│   │   ├── mythcheck.py           # POST /api/mythcheck
│   │   ├── translate.py           # POST /api/translate
│   │   └── history.py             # GET /api/history/quiz|myths
│   ├── services/
│   │   ├── gemini_service.py      # Gemini SDK, structured output, sanitization
│   │   ├── cache_service.py       # LRU cache with TTL
│   │   ├── firestore_service.py   # Firestore read/write
│   │   ├── auth_service.py        # Firebase token verification
│   │   └── translation_service.py # Cloud Translation API
│   ├── models/
│   │   └── schemas.py             # All Pydantic v2 models
│   ├── data/
│   │   ├── timeline.json          # 7 election stages (static, authoritative)
│   │   ├── glossary.json          # 40+ election terms
│   │   ├── institutions.json      # 6 electoral institutions
│   │   └── registration_steps.json
│   ├── tests/
│   │   ├── conftest.py            # Mocked Gemini + Firebase fixtures
│   │   ├── test_qa.py
│   │   ├── test_quiz.py
│   │   ├── test_mythcheck.py
│   │   ├── test_cache.py
│   │   └── test_auth.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.ts        # Firebase app initialization
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Auth state provider
│   │   ├── features/
│   │   │   ├── timeline/
│   │   │   ├── registration/
│   │   │   ├── comparison/
│   │   │   ├── glossary/
│   │   │   ├── mythcheck/
│   │   │   └── institutions/
│   │   ├── components/
│   │   │   ├── AuthGuard/
│   │   │   ├── LoginPage/
│   │   │   ├── ChatBubble/
│   │   │   ├── QuizModal/
│   │   │   ├── LanguageToggle/
│   │   │   └── Navbar/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useDebounce.ts
│   │   ├── services/
│   │   │   └── api.ts             # Typed API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── src/__tests__/
│   ├── firebase.json
│   └── .firebaserc
│
└── setup.sh                       # Secret Manager + Cloud Run binding script
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- gcloud CLI authenticated
- Firebase CLI installed

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your-gemini-api-key" > .env
echo "FRONTEND_URL=http://localhost:5173" >> .env
echo "GCP_PROJECT_ID=promptwars-495017" >> .env

# Start dev server
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install

# Create .env file with your Firebase config
cp .env.example .env
# Fill in VITE_FIREBASE_* values from Firebase Console

# Set backend URL
echo "VITE_API_URL=http://localhost:8000" >> .env

npm run dev
```

App available at: `http://localhost:5173`

---

## Running Tests

### Backend
```bash
cd backend
pytest --cov=. --cov-report=term-missing -v
```

Test coverage includes:
- All API endpoints (happy path + edge cases)
- Input validation (empty, oversized, injection attempts)
- Auth token verification (missing, invalid, valid)
- Cache hit/miss behavior
- All Gemini calls mocked — no real API calls in tests

### Frontend
```bash
cd frontend
vitest run --coverage --reporter=verbose
```

Test coverage includes:
- Smoke tests for all feature components
- Verdict display for all myth check outcomes
- Glossary search filter behavior
- Quiz modal state transitions
- Auth guard (logged in / logged out / loading states)
- axe-core accessibility tests on all major routes

---

## Deployment

### First-time setup

```bash
# Authenticate
gcloud auth login
gcloud config set project promptwars-495017

# Enable required APIs (already done)
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  translate.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### Bind Gemini API key to Cloud Run

```bash
chmod +x setup.sh
./setup.sh
```

This script:
1. Creates `GEMINI_API_KEY` secret in Secret Manager
2. Grants Cloud Run service account `secretAccessor` role
3. Binds the secret to the Cloud Run service as an env var

### Update CORS after Firebase deploy

```bash
gcloud run services update votewise-backend \
  --region asia-south1 \
  --update-env-vars FRONTEND_URL=https://promptwars-495017.web.app
```

### Redeploy after changes

Backend:
```bash
# Via Cloud Run MCP in Antigravity
# Or manually:
gcloud run deploy votewise-backend \
  --source backend/ \
  --region asia-south1
```

Frontend:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

## Security

- **API key management** — Gemini API key stored exclusively in Secret Manager, never in code or environment files committed to version control
- **Prompt injection protection** — All user inputs scanned for injection patterns (`ignore previous`, `system:`, `jailbreak`, etc.) before reaching Gemini
- **Input validation** — All inputs validated at Pydantic level (max lengths, required types) before any processing
- **Rate limiting** — 30 requests per minute per IP on all `/api/*` routes via slowapi
- **CORS** — Backend only accepts requests from the Firebase Hosting domain, never wildcard
- **Token verification** — All protected endpoints verify Firebase ID tokens on the backend via firebase-admin SDK. User ID always extracted from verified token, never from request body
- **Gemini output validation** — All Gemini responses validated through Pydantic models before returning to frontend. Raw LLM text never passed directly as JSON
- **Firestore rules** — Users can only read their own documents. All writes are backend-only

---

## Accessibility

VoteWise is built to WCAG AA standard:

- All color contrast ratios ≥ 4.5:1
- Full keyboard navigation across all features
- Visible focus rings on all interactive elements (`:focus-visible`)
- No information conveyed by color alone — all verdicts use icon + label + color
- ARIA roles on all dynamic components (timeline, stepper, modals, search)
- `aria-live="polite"` on all dynamic content regions
- Focus trap in modals, focus returns to trigger on close
- Skip-to-main-content link as first focusable element in DOM
- All loading states announce to screen readers via `aria-busy`
- axe-core integrated into frontend test suite — zero violations required to pass

---

## Political Neutrality

VoteWise is strictly non-partisan:

- Gemini is never asked to evaluate, rank, or compare political parties or candidates
- Candidate comparison module uses static, ECI-sourced factual data only — no AI involvement
- Myth checker cites official sources (ECI Handbook, Constitution, RPA 1951) — never asserts political opinions
- All election information is presented factually and neutrally

---

## Environment Variables

### Backend (.env for local, Secret Manager for production)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Firebase Hosting URL (for CORS) |
| `GCP_PROJECT_ID` | `promptwars-495017` |

### Frontend (.env)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Cloud Run backend URL |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `promptwars-495017.firebaseapp.com` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `promptwars-495017.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |

---

## Built With

VoteWise was built using [Antigravity](https://antigravity.dev) — a Google AI-powered IDE — with Gemini 1.5 Flash as the code generation model, deployed entirely on Google Cloud infrastructure.

---

## License

MIT License — free to use, modify, and distribute.

---

*VoteWise — Know your vote. Own your democracy.*
