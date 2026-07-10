import os


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./opticlean.db",
)

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
