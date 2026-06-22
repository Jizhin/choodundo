# 🔥 ChoodUndo (ചൂടുണ്ടോ?)

**Live, community-driven heat & sweat reports across Kerala.**

ChoodUndo answers one question — *"Is it hot there right now?"* — using real human
reports instead of raw temperature. No login, no signup, no profiles. Tap a button,
see Kerala's heat pulse update live.

It is built to feel like a **live activity stream** (Twitter timeline / Discord
activity channel), not a weather dashboard.

---

## Features

- ⚡ **Zero-login binary reporting** — `🔥 ചൂടാണ്` (HOT) vs `🍃 സാധാരണമാണ്` (NORMAL)
- 📍 **Location** — high-accuracy geolocation with a Kerala place/pincode search fallback
- 📡 **Live feed** — new reports stream in instantly over WebSockets
- 🗺️ **14-district heat map** — RED / ORANGE / GRAY status aggregated from local reports
- 🛡️ **Anti-spam** — `SHA256(IP + User-Agent)` fingerprint, 15-minute rate limit
- ⏳ **2-hour decay window** — only the last 2 hours count toward live state
- 🌑 **Dark-first command-center UI**

---

## Architecture

```
Browser (React 19 SPA)
        │
        ▼
   Nginx (edge reverse proxy :80/:443)
   ├── /            → frontend (static SPA, nginx)
   ├── /api/        → backend (FastAPI)
   └── /ws/live     → backend (WebSocket)
        │
        ▼
   FastAPI (Python 3.12, async)
   ├── PostgreSQL 16  (source of truth — reports)
   └── Redis 7        (rate limit · live feed cache · counters)
```

### Stack

| Layer        | Tech |
|--------------|------|
| Frontend     | React 19, Vite, TypeScript, TailwindCSS, TanStack Query, React Router, Axios, Zustand, Lucide |
| Backend      | FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), Alembic, AsyncPG |
| Data         | PostgreSQL 16, Redis 7 |
| Realtime     | FastAPI WebSockets |
| Geocoding    | Photon (OSM search-as-you-type) + offline Kerala pincode fallback |
| Infra        | Docker, Docker Compose, Nginx |

---

## Quick start (Docker)

```bash
cp .env.example .env        # then edit POSTGRES_PASSWORD
docker compose up -d --build
```

Open **http://localhost** — the app, API, and WebSocket are all served behind Nginx.

Check health:

```bash
curl http://localhost/health
```

---

## Local development (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Point DATABASE_URL / REDIS_URL at local Postgres + Redis (see app/config.py)
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173 — proxies /api and /ws to localhost:8000
```

---

## API

| Method | Path              | Purpose |
|--------|-------------------|---------|
| POST   | `/api/reports`    | Submit a HOT/NORMAL report |
| GET    | `/api/feed`       | Latest live reports (from Redis) |
| GET    | `/api/districts`  | 14-district summary over last 2h |
| GET    | `/api/stats`      | Total reports in last 2h |
| GET    | `/api/search`     | Search Kerala places (`?q=`) |
| GET    | `/api/location`   | Reverse geocode (`?lat=&lon=`) |
| WS     | `/ws/live`        | Live activity stream |
| GET    | `/health`         | Health check (app + Redis) |

### Submit payload

```json
POST /api/reports
{
  "status": "HOT",
  "place_name": "Payyannur",
  "district": "Kannur",
  "pincode": "670307",
  "latitude": 12.09,
  "longitude": 75.20
}
```

### WebSocket events

```json
{ "type": "NEW_REPORT", "status": "HOT", "name": "Arjun", "place": "Payyannur", "district": "Kannur", "time": "Just now" }
{ "type": "DISTRICT_UPDATE", "district": "Kannur", "hot_percentage": 72 }
```

---

## Core rules (enforced server-side)

1. **2-hour decay** — every counter/aggregation filters `created_at >= now() - 2h`.
2. **Anti-spam** — `SHA256(IP + User-Agent)` stored in Redis with a 15-min TTL.
   Repeat taps return **HTTP 200** but are **not** written to the database.
3. **District aggregation** — local reports roll up into the 14 official districts:
   - **RED** > 70% hot
   - **ORANGE** 40–70%
   - **GRAY** < 40% (or no data)

---

## District color thresholds

| Hot % (last 2h) | Level  | Border |
|-----------------|--------|--------|
| > 70%           | RED    | `#EF4444` |
| 40–70%          | ORANGE | `#F59E0B` |
| < 40% / none    | GRAY   | `#1F1F1F` |

---

## Production notes

- **HTTPS**: uncomment the TLS server block in `nginx/conf.d/default.conf`, mount certs
  into `nginx/certs/`, and expose `443` in `docker-compose.yml`.
- **Redis persistence**: AOF enabled (`--appendonly yes`).
- **Postgres backups**: e.g. `docker compose exec postgres pg_dump -U choodundo choodundo > backup.sql`.
- **Migrations**: run automatically on backend start via `entrypoint.sh` (`alembic upgrade head`).
- **Health checks**: defined for every service in `docker-compose.yml`.

---

Built for Kerala. ❤️ No accounts. No tracking. Just the heat.
