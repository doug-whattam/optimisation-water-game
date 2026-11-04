# OptiChallenge Water Game

A 3D interactive clean water network optimization game. Players design pipe networks to supply water from an elevated reservoir to customer demand nodes, competing on cost vs hydraulic performance.

## Architecture

- **Frontend**: React 18 + Three.js + Zustand + D3.js + Tailwind CSS
- **Backend**: Python FastAPI + WNTR (EPANET 2.2) + SQLAlchemy
- **Database**: PostgreSQL 15
- **Real-time**: WebSockets via FastAPI
- **Deployment**: Hugging Face Spaces (app) + Neon (Postgres), all free tiers; Docker Compose for local

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for frontend development)
- Python 3.11+ (for backend development)

### Run with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Deploying (free, stays awake)

The whole game runs as one container: the root `Dockerfile` builds the frontend
and the FastAPI backend serves it, so the site, API and WebSockets share one URL.

| Piece | Service | Free tier notes |
|---|---|---|
| App (frontend + API) | [Hugging Face Spaces](https://huggingface.co/spaces) (Docker) | 2 vCPU / 16 GB, no card. Pauses after 48 h with no traffic. |
| Database | [Neon](https://neon.tech) Postgres | No card. Wakes in under a second, so it never feels asleep. |
| Deploys + keep-alive | GitHub Actions | `deploy.yml` pushes on every merge to `master`; `keep-alive.yml` pings every 3 h. |

One-time setup:

1. **Neon**: create a project and copy its connection string
   (`postgresql://...neon.tech/neondb?sslmode=require`). The app converts it for asyncpg and creates its tables on startup.
2. **Hugging Face**: create a new Space, SDK **Docker**, blank template, public.
   In the Space's *Settings > Variables and secrets*, add a secret `DATABASE_URL` with the Neon string.
3. **Hugging Face token**: *Settings > Access Tokens > New token*, type **Write**.
4. **GitHub** (*repo Settings > Secrets and variables > Actions*):
   - secret `HF_TOKEN`: the token from step 3
   - variable `HF_SPACE`: `your-hf-username/your-space-name`
   - variable `APP_URL`: `https://your-hf-username-your-space-name.hf.space`
5. Run the **Deploy to Hugging Face** workflow (Actions tab) or merge to `master`. The first build takes a few minutes; the game is then at `APP_URL`.

GitHub turns off scheduled workflows after 60 days with no commits on a public repo;
re-enable **Keep alive** in the Actions tab if that happens.

## Game Rules

1. Connect pipes between the reservoir and customer demand points
2. Budget: 100,000 credits
3. Each pipe/connector has an asset cost + land-type installation cost
4. Click "Open Reservoir Valve" to simulate
5. Simulation stops when first tank reaches Target Water Level (TWL)
6. Penalty = sum of (TWL - actual level) for all tanks
7. Goal: minimize both Total Cost and Hydraulic Penalty (Pareto optimization)

## Project Structure

```
opticlean-water-game/
├── docker-compose.yml
├── frontend/          # React + Three.js + Tailwind
└── backend/           # FastAPI + WNTR + PostgreSQL
```
