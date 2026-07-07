# 🎬 The Box Office Science
### AI-Powered Film Investment Intelligence Platform

**Author:** [Mohammed Areeb](https://github.com/Imohammedareeb/)

> *"Where Silver Age energy meets cutting-edge financial intelligence."*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Cypress](https://img.shields.io/badge/Cypress-13-17202C?logo=cypress)](https://cypress.io)

A cinematic, comic book-themed investment dashboard for production studios — predict box office revenue, calculate real-world ROI, recommend high-performing IPs via NLP, and track active productions.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts, Zustand |
| Backend | FastAPI, Python 3.11, SQLAlchemy (async), Uvicorn, SlowAPI |
| Auth | JWT (python-jose), bcrypt (passlib), Next.js middleware |
| Database | PostgreSQL 16 + pgvector |
| Migrations | Alembic |
| Testing | Cypress 13 (E2E test suite) |
| Containers | Docker + Docker Compose |

---

## 🎨 Design System: The Kinetic Chronicle

- **0px border radius** — Sharp Edge Geometry is our signature
- **Classic Superhero CMYK Palette** — Action Red `#EE5454` · Hero Blue `#4C69F6` · Classic Yellow `#F6DB35` · Villain Purple `#714B96` · Toxic Green `#00A841`
- **Bento Grid Layout** — Modular, cinematic, glassmorphic panels
- **Space Grotesk + Work Sans** — Display and body type pairing
- **Full dark / light mode** — ThemeProvider + Tailwind `dark:` classes

---

## 🚀 Quick Start

### Option A — Docker (recommended, full stack)
```bash
cp .env.example .env          # fill in SECRET_KEY and other secrets
docker-compose up --build
```
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### Option B — Local dev without Docker
```bash
# 1. Database (Docker only for Postgres)
docker run -e POSTGRES_DB=boxoffice -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 --name bos-db pgvector/pgvector:pg16

# 2. Backend
cd backend
pip install -r ../requirements.txt
cp ../.env.example .env       # edit with your values
alembic upgrade head          # runs migrations + seeds demo user
uvicorn app.main:app --reload

# 3. Frontend
cd frontend
npm install
npm run dev
```

---

## 🔐 Authentication

Full JWT-based authentication system:

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Create account (rate-limited: 10/min) |
| `/api/auth/login` | POST | Login, receive JWT (rate-limited: 20/min) |
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/logout` | POST | Server-side logout acknowledgement |

**Security features:**
- bcrypt password hashing (12 rounds)
- Timing-safe login (prevents user enumeration)
- JWT stored in SameSite=Lax cookie (client-side; see cookies.ts for production HttpOnly upgrade path)
- Route protection via Next.js middleware
- Password strength validation (uppercase + digit required)
- Security headers: X-Frame-Options DENY, nosniff, CSP

**Demo credentials** (seeded via migration 003):
- Email: `demo@boxofficescience.ai`
- Password: `Demo@1234`

---

## 📁 Project Structure

```
box-office-science/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/           # Login page (real API call)
│   │   │   ├── signup/          # Registration page (real API call)
│   │   │   ├── oracle/          # Revenue Prediction Engine
│   │   │   ├── scanner/         # NLP Concept Recommender
│   │   │   ├── vault/           # Studio Vault (film archive)
│   │   │   ├── market/          # Market Pulse (sentiment)
│   │   │   ├── production/      # Active Venture Tracker
│   │   │   ├── not-found.tsx    # Branded 404
│   │   │   ├── error.tsx        # Global error boundary
│   │   │   └── loading.tsx      # Route loading skeleton
│   │   ├── middleware.ts         # JWT route protection
│   │   ├── store/
│   │   │   └── useStore.ts      # App state (Zustand + devtools)
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios client + all API functions
│   │   │   ├── auth.ts          # Client-side session management
│   │   │   ├── cookies.ts       # JWT cookie helpers
│   │   │   └── utils.ts         # cn(), formatters
│   │   └── hooks/
│   │       └── useApi.ts        # Data-fetching hooks
│   └── cypress/
│       ├── e2e/
│       │   ├── auth.cy.ts       # Auth flow test cases
│       │   ├── dashboard.cy.ts  # Feature test cases
│       │   └── qa_audit.cy.ts   # QA audit suite
│       └── support/
│           └── commands.ts      # Custom Cypress commands
│
├── backend/
│   ├── alembic/versions/
│   │   ├── 001_initial_schema.py   # movies table
│   │   ├── 002_add_users_table.py  # users table
│   │   └── 003_seed_demo_user.py   # demo user seed
│   └── app/
│       ├── controllers/
│       │   ├── auth.py          # /api/auth/*
│       │   ├── dashboard.py     # /api/dashboard/*
│       │   ├── predictions.py   # /api/predictions/*
│       │   ├── nlp.py           # /api/nlp/*
│       │   └── production.py    # /api/production/*
│       ├── models/
│       │   ├── orm_models.py    # Movie + User SQLAlchemy models
│       │   ├── auth_schemas.py  # Auth Pydantic schemas
│       │   └── financial_specs.py
│       ├── services/
│       │   ├── auth_service.py  # bcrypt + JWT
│       │   ├── roi_calculator.py
│       │   ├── nlp_matcher.py
│       │   └── sentiment_engine.py
│       └── api/
│           ├── dependencies.py  # DB session
│           └── auth_deps.py     # require_auth dependency
│
└── database/
    ├── init.sql                 # pgvector + uuid extensions
    └── schema/02_movies.sql    # 18 seed films
```

---

## 🧪 Running Tests

```bash
cd frontend
npm install

# Seed demo user first (if running against live backend)
# alembic upgrade head  (from backend/)

# Interactive (opens Cypress UI)
npm run cy:open

# Headless (for CI)
npm run cy:run
```

---

## 🗄️ Database Migrations

```bash
cd backend

# Apply all migrations (including demo user seed)
alembic upgrade head

# Generate new migration after model change
alembic revision --autogenerate -m "add_embeddings_column"

# Rollback one step
alembic downgrade -1
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing key — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL for the frontend |
| `TMDB_API_KEY` | ⬜ | The Movie Database API key |
| `OMDB_API_KEY` | ⬜ | OMDb (IMDb data) API key |
| `OPENAI_API_KEY` | ⬜ | Future: GPT-powered concept analysis |
| `DEBUG` | ⬜ | Enable verbose logging (default: false) |

---

## 🔜 Upgrade Paths

1. **HttpOnly cookies** — Move token cookie to server-side via FastAPI `response.set_cookie(httponly=True, secure=True)` (see `cookies.ts` for details)
2. **Real NLP** — Replace keyword scorer in `nlp_matcher.py` with `sentence-transformers` + pgvector `<=>` cosine similarity
3. **TMDb sync** — Scheduled job using `TMDB_API_KEY` to populate the `movies` table nightly
4. **Token blocklist** — Add Redis blocklist in `auth_service.py` for true server-side logout
5. **WebSocket sentiment** — Stream live market signals via FastAPI WebSockets to the Market Pulse page

---

*Built with the energy of a Silver Age splash page. Resume-ready. Production-structured.*
