from datetime import datetime

from pydantic import BaseModel, Field


class PlacedAssetSchema(BaseModel):
    row: int = Field(ge=1, le=6)
    col: str = Field(pattern=r"^[A-F]$")
    asset_type: str
    rotation_degrees: int = Field(default=0)


class DesignSubmitRequest(BaseModel):
    session_id: str
    grid_state: list[PlacedAssetSchema] = Field(min_length=1)


class DesignResponse(BaseModel):
    id: str
    plan_number: int
    total_cost: int
    asset_cost: int
    installation_cost: int
    submitted_at: datetime


class SimulationTriggerResponse(BaseModel):
    simulation_id: str
    status: str


class TankLevels(BaseModel):
    residential: float = 0.0
    hospital: float = 0.0
    industrial: float = 0.0
    commercial: float = 0.0


class SimulationResultResponse(BaseModel):
    simulation_id: str
    design_id: str
    status: str
    stopping_tank: str | None = None
    tank_levels: dict[str, float] | None = None
    individual_penalties: dict[str, float] | None = None
    hydraulic_penalty: float | None = None
    total_cost: int
    error_message: str | None = None


class ParetoPointResponse(BaseModel):
    design_id: str
    player_username: str
    plan_number: int
    total_cost: float
    hydraulic_penalty: float
    is_pareto_optimal: bool


class ParetoResponse(BaseModel):
    designs: list[ParetoPointResponse]
    pareto_frontier: list[dict]
