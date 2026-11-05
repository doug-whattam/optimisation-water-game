import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def _normalise_database_url(url: str) -> tuple[str, bool]:
    """Accept a plain postgres:// URL (as Neon and most hosts hand out) and
    convert it for asyncpg, which uses its own driver prefix and rejects
    libpq-only query params like sslmode. Returns (url, needs_ssl)."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    if not url.startswith("postgresql+asyncpg://"):
        return url, False

    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query))
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    needs_ssl = sslmode in ("require", "verify-ca", "verify-full")
    return urlunsplit(parts._replace(query=urlencode(query))), needs_ssl


DATABASE_URL, DATABASE_SSL = _normalise_database_url(
    os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./opticlean.db")
)

# Built frontend to serve from the API process (single-container deploys).
# Unset or missing directory means the API runs on its own.
STATIC_DIR = os.getenv("STATIC_DIR", "")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(",")

BUDGET = 100_000
RESERVOIR_HEAD = 50.0  # metres (enough head to fill tanks to 5m)
PIPE_LENGTH = 100.0  # metres (grid cell spacing)
PIPE_DIAMETER = 0.15  # metres (150mm)
PIPE_ROUGHNESS = 120.0  # Hazen-Williams C
TANK_DIAMETER = 1.0  # metres (small tanks fill quickly, shows differences)
TANK_TWL = 5.0  # metres (target water level / max level)
SIMULATION_DURATION = 7200  # seconds (2 hours max — tanks fill fast, keeps EPANET quick)
HYDRAULIC_TIMESTEP = 60  # seconds
SIMULATION_TIMEOUT = 30  # seconds max per run
