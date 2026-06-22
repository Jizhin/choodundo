"""WebSocket endpoint for the live activity stream."""
from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket_manager import manager

logger = logging.getLogger("choodundo.ws")

router = APIRouter()


@router.websocket("/ws/live")
async def live_socket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        # Greet the client; thereafter the connection is push-only.
        await websocket.send_json({"type": "CONNECTED", "clients": manager.count})
        while True:
            # Keep the connection open; ignore/echo client pings.
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as exc:  # noqa: BLE001
        logger.warning("ws error: %s", exc)
        await manager.disconnect(websocket)
