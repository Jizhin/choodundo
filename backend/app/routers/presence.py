from fastapi import APIRouter
from pydantic import BaseModel

from app.redis_client import heartbeat as redis_heartbeat

router = APIRouter(prefix="/api", tags=["presence"])


class HeartbeatRequest(BaseModel):
    session_id: str


@router.post("/heartbeat")
async def heartbeat(body: HeartbeatRequest) -> dict:
    count = await redis_heartbeat(body.session_id)
    return {"online": count}
