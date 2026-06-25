# OptiClean Water Game

A 3D interactive clean water network optimization game. Players design pipe networks to supply water from an elevated reservoir to customer demand nodes, competing on cost vs hydraulic performance.

## Architecture

- **Frontend**: React 18 + Three.js + Zustand + D3.js + Tailwind CSS
- **Backend**: Python FastAPI + WNTR (EPANET 2.2) + SQLAlchemy
- **Database**: PostgreSQL 15
- **Real-time**: WebSockets via FastAPI
- **Deployment**: Docker Compose

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
