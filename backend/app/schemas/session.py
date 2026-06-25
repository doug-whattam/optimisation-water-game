from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    name: str = Field(max_length=100, min_length=1)
    max_players: int = Field(default=10, ge=2, le=50)


class PlayerInfo(BaseModel):
    id: UUID
    username: str
    connected_at: datetime
    is_connected: bool


class SessionResponse(BaseModel):
    id: UUID
    name: str
    max_players: int
    status: str
    grid_config: list[dict]
    player_count: int
    players: list[PlayerInfo]
    created_at: datetime


class JoinRequest(BaseModel):
    username: str = Field(max_length=50, min_length=1, pattern=r"^[a-zA-Z0-9 _-]+$")


class JoinResponse(BaseModel):
    player_id: UUID
    session_token: str
    session: SessionResponse
