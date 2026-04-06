"""
WebSocket endpoint for real-time notifications.

WS /ws/notifications  — persistent connection; server pushes notification events
                         as JSON without the client needing to poll.

Connection flow:
  1. Client connects: ws://host/api/v1/ws/notifications?token=<access_token>
  2. Server verifies JWT, registers connection in connection manager
  3. Server pushes events: {"type": "notification", "data": {...}}
  4. Client disconnects → server cleans up
"""

import json
import logging
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.models.notification import Notification

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Connection manager — holds live WS connections keyed by user_id
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        # user_id (str) → list of active WebSocket connections (multi-tab support)
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)
        logger.info("WS connected: user=%s total_conns=%d", user_id, len(self._connections[user_id]))

    def disconnect(self, websocket: WebSocket, user_id: str):
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, payload: dict):
        """Push a JSON payload to all connections for a given user."""
        conns = self._connections.get(user_id, [])
        dead = []
        for ws in conns:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, payload: dict):
        """Push to every connected user (e.g. system announcements)."""
        for uid in list(self._connections.keys()):
            await self.send_to_user(uid, payload)

    @property
    def connected_user_ids(self) -> List[str]:
        return list(self._connections.keys())


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@router.websocket("/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token for authentication"),
):
    """
    Real-time notification stream.

    Connect with: `wss://<host>/api/v1/ws/notifications?token=<access_token>`

    The server sends JSON messages:
    ```json
    {"type": "notification", "data": {"id": "...", "title": "...", "message": "...", ...}}
    {"type": "ping", "data": {}}
    ```
    """
    # Authenticate via query-param token (WS can't send custom headers in browser)
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)

    # Push unread notifications on connect
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Notification)
                .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
                .order_by(Notification.created_at.desc())
                .limit(10)
            )
            unread = result.scalars().all()
            for n in unread:
                await manager.send_to_user(user_id, {
                    "type": "notification",
                    "data": {
                        "id": str(n.id),
                        "title": n.title,
                        "message": n.message,
                        "notification_type": str(n.notification_type),
                        "is_read": n.is_read,
                        "created_at": n.created_at.isoformat(),
                    },
                })
    except Exception as exc:
        logger.warning("WS initial push failed: %s", exc)

    try:
        while True:
            # Keep-alive: accept any client message (e.g. ping) and echo pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "data": {}}))
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info("WS disconnected: user=%s", user_id)
