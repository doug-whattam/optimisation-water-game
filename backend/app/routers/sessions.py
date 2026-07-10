"""Game session endpoints."""

import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import GameSession, Player
from app.schemas.session import (
    SessionCreate,
    SessionResponse,
    JoinRequest,
    JoinResponse,
    PlayerInfo,
)
from app.services.grid_config import DEFAULT_GRID_CONFIG

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _session_to_response(session: GameSession) -> SessionResponse:
    connected = [p for p in session.players if p.is_connected]
    return SessionResponse(
        id=session.id,
        name=session.name,
        max_players=session.max_players,
        status=session.status,
        grid_config=session.grid_config,
        player_count=len(connected),
        players=[
            PlayerInfo(
                id=p.id,
                username=p.username,
                connected_at=p.connected_at,
                is_connected=p.is_connected,
            )
            for p in connected
        ],
        created_at=session.created_at,
    )


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = GameSession(
        name=body.name,
        max_players=body.max_players,
        grid_config=DEFAULT_GRID_CONFIG,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return _session_to_response(session)


@router.get("/default", response_model=SessionResponse)
async def get_or_create_default_session(db: AsyncSession = Depends(get_db)):
    """Get the default game session, creating it if it doesn't exist."""
    result = await db.execute(
        select(GameSession).where(GameSession.status.in_(["lobby", "active"])).limit(1)
    )
    session = result.scalar_one_or_none()
    if session:
        return _session_to_response(session)

    # Create the default session
    session = GameSession(
        name="Optimisation Water Game",
        max_players=50,
        grid_config=DEFAULT_GRID_CONFIG,
        status="active",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return _session_to_response(session)


@router.post("/reset")
async def reset_lobby(db: AsyncSession = Depends(get_db)):
    """Delete all sessions, players, designs, and results. Recreate fresh."""
    from app.models import SimulationResult, NetworkDesign, Player
    await db.execute(SimulationResult.__table__.delete())
    await db.execute(NetworkDesign.__table__.delete())
    await db.execute(Player.__table__.delete())
    await db.execute(GameSession.__table__.delete())
    await db.commit()
    return {"status": "ok", "message": "All data has been reset"}


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_to_response(session)


@router.post("/{session_id}/join", response_model=JoinResponse)
async def join_session(session_id: str, body: JoinRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check max players
    connected = [p for p in session.players if p.is_connected]
    if len(connected) >= session.max_players:
        raise HTTPException(status_code=409, detail=f"Session has reached maximum player count ({session.max_players})")

    # Check duplicate username
    for p in session.players:
        if p.username == body.username and p.is_connected:
            raise HTTPException(status_code=409, detail=f"Username '{body.username}' is already taken in this session")

    # Create player
    token = secrets.token_urlsafe(96)
    player = Player(
        username=body.username,
        session_id=session.id,
        session_token=token,
    )
    db.add(player)

    # Activate session if first player
    if session.status == "lobby":
        session.status = "active"

    await db.commit()
    await db.refresh(session)

    return JoinResponse(
        player_id=player.id,
        session_token=token,
        session=_session_to_response(session),
    )


@router.get("", response_model=list[SessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GameSession).where(GameSession.status.in_(["lobby", "active"]))
    )
    sessions = result.scalars().all()
    return [_session_to_response(s) for s in sessions]
