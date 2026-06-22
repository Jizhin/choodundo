"""Location resolution & place search via Photon (OSM search-as-you-type).

Photon gives fast, typo-tolerant autocomplete over OpenStreetMap data. Both
endpoints constrain results to Kerala (bounding box + state check) and map them
onto the 14 official districts. The pincode dataset is the offline fallback, and
a small in-memory TTL cache softens typeahead traffic.
"""
from __future__ import annotations

import logging
import time

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.data.kerala import district_from_pincode, normalize_district
from app.schemas import LocationResolved, PlaceSearchResult

logger = logging.getLogger("choodundo.location")

router = APIRouter(prefix="/api", tags=["location"])

_HEADERS = {"User-Agent": settings.geocoder_user_agent, "Accept-Language": "en"}
_TIMEOUT = httpx.Timeout(8.0)

# Tiny TTL cache: query -> (expires_at, features). Cheap protection for typeahead.
_CACHE: dict[str, tuple[float, list[dict]]] = {}
_CACHE_TTL = 120.0


def _cache_get(key: str) -> list[dict] | None:
    hit = _CACHE.get(key)
    if hit and hit[0] > time.monotonic():
        return hit[1]
    _CACHE.pop(key, None)
    return None


def _cache_set(key: str, value: list[dict]) -> None:
    if len(_CACHE) > 500:
        _CACHE.clear()
    _CACHE[key] = (time.monotonic() + _CACHE_TTL, value)


def _is_kerala(props: dict, lon: float | None, lat: float | None) -> bool:
    state = (props.get("state") or "").lower()
    if "kerala" in state:
        return True
    # Fall back to the bounding box when state is missing.
    if lon is not None and lat is not None:
        min_lon, min_lat, max_lon, max_lat = settings.kerala_bbox_tuple
        return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat
    return False


def _pick_district(props: dict) -> str | None:
    for key in ("county", "district", "state_district", "city", "town", "locality"):
        d = normalize_district(props.get(key))
        if d:
            return d
    return None


def _pick_place_name(props: dict) -> str:
    # Most specific human-readable label first.
    for key in ("name", "locality", "suburb", "village", "town", "city", "district"):
        if props.get(key):
            return str(props[key])
    return "Unknown"


async def _photon_get(path: str, params: dict) -> list[dict]:
    async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
        resp = await client.get(f"{settings.photon_url}{path}", params=params)
        resp.raise_for_status()
        data = resp.json()
    return data.get("features", [])


@router.get("/search", response_model=list[PlaceSearchResult])
async def search_place(
    q: str = Query(..., min_length=2, max_length=80),
    limit: int = Query(default=8, ge=1, le=15),
) -> list[PlaceSearchResult]:
    """Typeahead search for Kerala places via Photon."""
    cleaned = q.strip()
    cache_key = f"s:{cleaned.lower()}|{limit}"
    features = _cache_get(cache_key)
    if features is None:
        min_lon, min_lat, max_lon, max_lat = settings.kerala_bbox_tuple
        # Bias toward the centre of Kerala and hard-limit to its bounding box.
        center_lat = (min_lat + max_lat) / 2
        center_lon = (min_lon + max_lon) / 2
        params = {
            "q": cleaned,
            "limit": max(limit * 3, 15),  # over-fetch; we filter to Kerala below
            "lang": "en",
            "lat": center_lat,
            "lon": center_lon,
            "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
        }
        try:
            features = await _photon_get("/api/", params)
        except httpx.HTTPError as exc:
            logger.warning("photon search failed: %s", exc)
            raise HTTPException(status_code=502, detail="Search service unavailable")
        _cache_set(cache_key, features)

    out: list[PlaceSearchResult] = []
    seen: set[tuple[str, str]] = set()
    for f in features:
        props = f.get("properties", {})
        coords = (f.get("geometry") or {}).get("coordinates") or [None, None]
        lon, lat = coords[0], coords[1]
        if not _is_kerala(props, lon, lat):
            continue
        pincode = props.get("postcode")
        district = _pick_district(props) or district_from_pincode(pincode)
        if not district:
            continue
        name = _pick_place_name(props)
        key = (name.lower(), district.lower())
        if key in seen:
            continue
        seen.add(key)
        out.append(
            PlaceSearchResult(
                place_name=name,
                district=district,
                pincode=pincode,
                latitude=float(lat) if lat is not None else None,
                longitude=float(lon) if lon is not None else None,
            )
        )
        if len(out) >= limit:
            break
    return out


@router.get("/location", response_model=LocationResolved)
async def detect_location(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> LocationResolved:
    """Reverse geocode lat/lon into a Kerala locality + district via Photon."""
    params = {"lat": lat, "lon": lon, "lang": "en"}
    try:
        features = await _photon_get("/reverse", params)
    except httpx.HTTPError as exc:
        logger.warning("photon reverse failed: %s", exc)
        raise HTTPException(status_code=502, detail="Geocoding service unavailable")

    if not features:
        raise HTTPException(status_code=404, detail="Could not resolve this location")

    props = features[0].get("properties", {})
    pincode = props.get("postcode")
    district = _pick_district(props) or district_from_pincode(pincode)
    if not district:
        raise HTTPException(
            status_code=404, detail="Could not resolve a Kerala district for this location"
        )
    return LocationResolved(
        place_name=_pick_place_name(props),
        district=district,
        pincode=pincode,
        latitude=lat,
        longitude=lon,
    )
