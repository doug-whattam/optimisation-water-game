"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.config import CORS_ORIGINS, STATIC_DIR
from app.database import async_session_factory, create_tables
from app.models import Player
from app.routers import sessions, designs, pareto
from app.websocket.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: create any missing tables (SQLite dev mode or a fresh Postgres)
    await create_tables()
    yield


app = FastAPI(
    title="OptiChallenge Water Game",
    description="3D Clean Water Network Optimization Game API",
    version="1.0.0",
    lifespan=lifespan,
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


# Serve the built frontend from the same origin when STATIC_DIR is set. Registered
# last so the /api and /ws routes above take priority.
_static = Path(STATIC_DIR) if STATIC_DIR else None
if _static and _static.is_dir():
    app.mount("/assets", StaticFiles(directory=_static / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404)
        file = (_static / path).resolve()
        if path and file.is_file() and file.is_relative_to(_static.resolve()):
            return FileResponse(file)
        return FileResponse(_static / "index.html")
