"""Utility helpers: anti-spam hashing, anonymous names, relative time."""
from __future__ import annotations

import hashlib
import random
from datetime import datetime, timezone

from fastapi import Request

# A small pool of common Malayali first names for the anonymous live feed.
_NAMES = [
    "Arjun", "Nithin", "Jithin", "Firoz", "Anand", "Vishnu", "Rahul", "Akhil",
    "Sreejith", "Midhun", "Aravind", "Gokul", "Hari", "Manu", "Sanju", "Vivek",
    "Aswin", "Jibin", "Nikhil", "Pranav", "Sachin", "Tony", "Bibin", "Deepak",
    "Aiswarya", "Anjali", "Devika", "Gopika", "Keerthana", "Lakshmi", "Meera",
    "Nandana", "Parvathy", "Reshma", "Sneha", "Vidya", "Athira", "Divya",
]


def get_client_ip(request: Request) -> str:
    """Resolve the real client IP, honouring X-Forwarded-For from Nginx."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "0.0.0.0"


def compute_user_hash(request: Request) -> str:
    """SHA256(IP + UserAgent) — anonymous device fingerprint for rate limiting."""
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent", "")
    return hashlib.sha256(f"{ip}{ua}".encode("utf-8")).hexdigest()


def random_name() -> str:
    return random.choice(_NAMES)


def relative_time(ts: datetime) -> str:
    """Human-friendly relative time string, e.g. 'Just now', '3m ago'."""
    now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    delta = (now - ts).total_seconds()
    if delta < 10:
        return "Just now"
    if delta < 60:
        return f"{int(delta)}s ago"
    if delta < 3600:
        return f"{int(delta // 60)}m ago"
    if delta < 86400:
        return f"{int(delta // 3600)}h ago"
    return f"{int(delta // 86400)}d ago"


def level_from_percentage(hot_percentage: int) -> str:
    """RED > 70%, ORANGE 40-70%, GRAY < 40%."""
    if hot_percentage > 70:
        return "RED"
    if hot_percentage >= 40:
        return "ORANGE"
    return "GRAY"
