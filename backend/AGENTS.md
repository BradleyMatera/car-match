# AGENTS.md — backend/

Node 18 + Express 5 API. See root `AGENTS.md` for the big picture.

## Run

```bash
npm i
node server.js                 # http://localhost:3001, in-memory stores
# With persistence:
MONGODB_URI='mongodb+srv://...' JWT_SECRET=dev node server.js
# Local HTTPS:
DEV_HTTPS=true DEV_HTTPS_CERT=../certs/dev/server.crt DEV_HTTPS_KEY=../certs/dev/server.key node server.js
```

## Layout

- `server.js` — entry point. Middleware wiring + all 37 routes (auth, users, messages, events, forums, stats, admin). ~1,955 lines.
- `middleware/rateLimits.js` — `generalLimiter`, `authLimiter`, `createSensitiveLimiter`. Disabled wholesale when `DISABLE_RATE_LIMIT=1`.
- `models/` — Mongoose schemas: `user.js`, `event.js`, `message.js`, `forum.js` (`ForumThread`, `ForumPost`). Loaded only when `MONGODB_URI` is set.
- `logger/index.js` — Winston + daily-rotate-file. Custom levels include `security`. `securityEvent(msg, meta)` emits to `security-*.log`. In production, console transport is off unless `LOG_TO_CONSOLE=true` (set this on Cloud Run).
- `seed/` + `scripts/seedFromMock.js` — seed MongoDB from historical mock data.
- `Dockerfile` / `.dockerignore` — container build for Cloud Run.

## Data layer: dual mode

The backend has TWO storage modes and switches automatically on `MONGODB_URI`:
- **Mongo mode**: Mongoose models (`UserModel`, `EventModel`, `MessageModel`, `ForumThread`, `ForumPost`).
- **In-memory mode**: module-level arrays (`users`, `events`, `messages`) + forum caches. Seeded with demo users (`demo`/`jane`/`mike`, password `password123`) and demo events on boot.

Every route handles BOTH paths (look for `source === 'db'` vs `// Memory fallback`). When adding a route, implement both branches or it breaks in-memory mode.

## Auth

- `POST /register` → bcrypt-hashed password, returns JWT.
- `POST /login` → verifies bcrypt, returns JWT `{ token, userId, username, ... }`.
- `authenticateToken` middleware validates JWT and checks `tokenVersion` against `TOKEN_VERSION` (bump to force re-login).
- JWT payload: `{ id, username, role, developerOverride, tokenVersion }`.
- `JWT_SECRET` required when `NODE_ENV !== 'development'`.

## Key endpoints (full list in `docs/API.md`)

- Auth: `POST /register`, `POST /login`, `GET /protected`, `GET /users/me`
- Users: `PATCH /users/:userId`, `DELETE /users/:userId`, `PUT /users/:userId/upgrade-to-premium`, `PUT /users/:userId/toggle-dev-override`, `PUT /admin/users/:userId/role`
- Messages: `POST /messages`, `GET /messages/inbox?category=&filterGender=&filterRadius=&sortBy=`
- Events: `GET /events`, `GET /events/:eventId`, `POST /events`, `PUT /events/:eventId`, `DELETE /events/:eventId`, `POST /events/:eventId/rsvp`, `DELETE /events/:eventId/rsvp`, `GET /my-rsvps`, `POST /events/:eventId/ensure-thread`, comments CRUD
- Forums: `GET /forums/categories`, `GET /forums/stats`, `GET /forums/categories/:categoryId/threads`, `POST /forums/threads`, `GET /forums/threads/:threadId`, `POST /forums/threads/:threadId/posts`, `PATCH .../pin`, `PATCH .../lock`, `DELETE /forums/threads/:threadId`, `POST /forums/posts/:postId/report`
- Stats: `GET /stats/site`, `GET /healthz`

## CORS / security

- `ALLOWED_ORIGINS` CSV allow-list. `https://bradleymatera.github.io` is always included. localhost allowed in non-production.
- `helmet` for hardened headers; CSP `connect-src` includes allowed origins.
- Rate limits: ~50 auth attempts / 5 min, ~180 sensitive actions / 30 min (configurable in `middleware/rateLimits.js`).
- `securityEvent` is called on 401/403 and sensitive mutations (event create/update/delete, role change, etc.).

## Deploy (Cloud Run)

```bash
# Build + push image
gcloud builds submit ./backend \
  --tag us-central1-docker.pkg.dev/car-match-prod-bm/car-match/backend:latest \
  --project=car-match-prod-bm

# Deploy (see docs/DEPLOYMENT.md for the full env-var set)
gcloud run deploy car-match-backend \
  --image us-central1-docker.pkg.dev/car-match-prod-bm/car-match/backend:latest \
  --region us-central1 --allow-unauthenticated --port 8080 \
  --set-env-vars NODE_ENV=production,TOKEN_VERSION=1,LOG_TO_CONSOLE=true,LOG_DIR=/tmp/logs \
  --set-secrets JWT_SECRET=... \
  --project=car-match-prod-bm
```

The container listens on `PORT` (Cloud Run injects `8080`). No code change was needed to containerize.

## Conventions

- All routes live in `server.js`. If you split them out, keep route paths identical (the frontend depends on them).
- Never `fetch` from a model directly in a route without handling both db and in-memory branches.
- Don't commit `logger/logs/`, `.env`, or `node_modules/`.
- Keep `npm run audit` (`--audit-level=critical`) passing.
