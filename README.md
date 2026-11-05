# OptiChallenge Water Game

A 3D interactive clean water network optimization game. Players design pipe networks to supply water from an elevated reservoir to customer demand nodes, competing on cost vs hydraulic performance.

## Architecture

- **Frontend**: React 18 + Three.js + Zustand + D3.js + Tailwind CSS
- **Backend**: Python FastAPI + WNTR (EPANET 2.2) + SQLAlchemy
- **Database**: PostgreSQL 15
- **Real-time**: WebSockets via FastAPI
- **Deployment**: Render (app) + Neon (Postgres), all free tiers; Docker Compose for local

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
| App (frontend + API) | [Render](https://render.com) web service (Docker, `render.yaml`) | 750 h/month covers one service 24/7. Sleeps after 15 min without traffic. |
| Database | [Neon](https://neon.tech) Postgres | Wakes in under a second, so it never feels asleep. Data survives Render restarts. |
| Keep awake | [cron-job.org](https://cron-job.org) | Pings `/api/health` every 10 min so Render never sleeps. `keep-alive.yml` is a GitHub backup. |

One-time setup:

1. **Neon**: copy the project's connection string from the Neon console
   (`postgresql://...neon.tech/neondb?sslmode=require`), or run `neon connection-string`.
   The app converts it for asyncpg and creates its tables on startup.
2. **Render**: *New > Blueprint*, pick this repo, and paste the Neon string when it asks for `DATABASE_URL`.
   Render deploys on every push to `master`. Then delete the old API and static-site services.
3. **cron-job.org**: create a job that GETs `https://<your-service>.onrender.com/api/health` every 10 minutes.
4. **GitHub** (*repo Settings > Secrets and variables > Actions*): variable `APP_URL` set to the Render URL, for the backup pinger.

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
