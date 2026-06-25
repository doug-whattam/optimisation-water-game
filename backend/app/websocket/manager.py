"""WebSocket connection manager for real-time multiplayer updates."""

import json
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections grouped by session."""

    def __init__(self):
        # session_id -> list of (websocket, player_username) tuples
        self.active_connections: dict[str, list[tuple[WebSocket, str]]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, username: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append((websocket, username))

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id] = [
                (ws, user) for ws, user in self.active_connections[session_id]
                if ws != websocket
            ]
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast_to_session(self, session_id: str, message: dict):
        """Send a message to all connected clients in a session."""
        if session_id not in self.active_connections:
            return
        disconnected = []
        for ws, username in self.active_connections[session_id]:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                disconnected.append((ws, username))

        # Clean up disconnected
        for item in disconnected:
            self.active_connections[session_id].remove(item)

    async def send_to_player(self, session_id: str, username: str, message: dict):
        """Send a message to a specific player."""
        if session_id not in self.active_connections:
            return
        for ws, user in self.active_connections[session_id]:
            if user == username:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    pass
                break


# Global singleton
manager = ConnectionManager()
