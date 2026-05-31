# CryptoTracker Backend (NestJS)

This service provides a small NestJS backend that periodically fetches top cryptocurrency data from CoinGecko and caches it in Redis. It also exposes simple HTTP endpoints to view cached data and trigger updates.

Requirements
- Node 18+ / npm
- A running Redis instance (local or remote)

Environment variables
- `PORT` (optional) - server port, default 3000
- `REDIS_URL` - Redis connection URL, e.g. `redis://127.0.0.1:6379`
- `UPDATE_CRON` - cron expression for scheduled updates (default `*/2 * * * *` = every 2 minutes)
- `COINGECKO_BASE_URL` - API base URL (default `https://api.coingecko.com/api/v3`)

Install & run (development)
```bash
cd backend
npm install
# dev mode with auto-reload
npm run start:dev
```

Build & run production
```bash
cd backend
npm run build
npm run start:prod
```

Endpoints
- `GET /api/coins` — returns latest cached coins list (or empty array)
- `POST /api/coins/update` — trigger an immediate update (returns 202)
- `GET /api/status` — returns `{ lastUpdate, coinsCount }`

Notes
- The scheduled job uses NestJS `@nestjs/schedule` and by default runs every 2 minutes. To change, set `UPDATE_CRON` to a valid cron expression.
- The service caches the CoinGecko response under Redis key `coins:latest` and stores last update timestamp in `coins:lastUpdate`.
- If you need a `.env.example` file but your repo ignores `.env*` files, copy the env vars from the "Environment variables" section above into your local `.env`.

Quick security & test
- The update endpoint (`POST /api/coins/update`) is protected by a simple rate limiter (NestJS Throttler). By default it allows 1 request per 60 seconds per client. You can tune this with:
  - `UPDATE_THROTTLE_TTL` (seconds, default 60)
  - `UPDATE_THROTTLE_LIMIT` (requests per ttl, default 1)

Quick test script
1. Start the server (`npm run start:dev`) and ensure Redis is reachable.
2. From repo root run:
```bash
node backend/test/test_rate_limit.js
# or to point to a different host: BASE_URL=http://localhost:4000 node backend/test/test_rate_limit.js
```
You should see the first request succeed (202) and subsequent rapid requests receive 429 responses.

Troubleshooting
- If you see import/type errors locally, run `npm install` in `backend/` to install dependencies.
- Ensure Redis is reachable at `REDIS_URL`.


