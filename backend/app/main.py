"""FastAPI application entry point."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import CORS_ORIGINS
from app.database import async_session_factory
from app.models import Player
from app.routers import sessions, designs, pareto
from app.websocket.manager import manager

app = FastAPI(
    title="OptiClean Water Game",
    description="3D Clean Water Network Optimization Game API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(sessions.router)
app.include_router(designs.router)
app.include_router(pareto.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "opticlean-water-game"}


@app.websocket("/ws/sessions/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = Query(...)):
    """WebSocket endpoint for real-time session updates."""
    # Authenticate via token
    async with async_session_factory() as db:
        result = await db.execute(select(Player).where(Player.session_token == token))
        player = result.scalar_one_or_none()

    if not player:
        await websocket.close(code=4001, reason="Invalid token")
        return

    if str(player.session_id) != session_id:
        await websocket.close(code=4002, reason="Token does not match session")
        return

    username = player.username
    await manager.connect(websocket, session_id, username)

    # Notify others
    await manager.broadcast_to_session(
        session_id,
        {"type": "player_joined", "data": {"username": username}},
    )

    try:
        while True:
            data = await websocket.receive_text()
            # Handle ping/pong
            if data == '{"type":"ping"}':
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        await manager.broadcast_to_session(
            session_id,
            {"type": "player_left", "data": {"username": username}},
        )
