import os


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://opticlean:opticlean_pass@localhost:5432/opticlean",
)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

BUDGET = 100_000
RESERVOIR_HEAD = 100.0  # metres
PIPE_LENGTH = 100.0  # metres (grid cell spacing)
PIPE_DIAMETER = 0.2  # metres (200mm)
PIPE_ROUGHNESS = 130.0  # Hazen-Williams C
TANK_DIAMETER = 10.0  # metres
TANK_TWL = 5.0  # metres (target water level / max level)
SIMULATION_DURATION = 86400  # seconds (24 hours max)
HYDRAULIC_TIMESTEP = 60  # seconds
SIMULATION_TIMEOUT = 30  # seconds max per run
