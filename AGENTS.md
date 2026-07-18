# AGENTS.md — Car Match

Guidance for AI agents (and humans) working in this repo. Read this first.

## What this is

Car Match is a car-enthusiast community app: profiles, events (with RSVP + comments), forums (categories/threads/posts + moderation), and user-to-user messaging with premium gating. Frontend is a React SPA; backend is a Node/Express API.

Owner: Bradley Matera. Repo: https://github.com/BradleyMatera/car-match

## Architecture (current)

```
GitHub Pages (React SPA, HashRouter)  --HTTPS-->  Cloud Run (Express API, container)
                                                       |
                                                       +-- MongoDB Atlas (optional, via MONGODB_URI)
                                                       +-- in-memory RAM stores (fallback when no DB)
```

- **Frontend**: React 19 (Create React App), deployed to GitHub Pages. `HashRouter` so Pages needs no server rewrites. Talks to backend via `src/api/client.js`.
- **Backend**: Node 18 + Express 5, single `backend/server.js` (~1,955 lines, 37 routes). JWT auth (with token versioning), bcrypt, helmet, CORS hardening, express-rate-limit, winston logging. Persists to MongoDB Atlas via Mongoose when `MONGODB_URI` is set; otherwise runs on in-memory stores (seeded with demo data) so the app stays usable.
- **Hosting**: backend runs as a container on **Google Cloud Run** (`us-central1`). Free tier (2M req/mo). Stable HTTPS URL on `*.run.app`. A GitHub Actions keep-warm workflow pings `/healthz` every 5 min so the instance stays warm (Cloud Run otherwise scales to zero after ~10-15 min idle). Frontend stays on GitHub Pages (free).

### Why Cloud Run (not Render)
Render's free tier spins the backend down after 15 min idle, causing multi-minute logins. Cloud Run cold starts are ~1-5s, and the keep-warm pinger makes them effectively never happen for users. No backend code was changed to migrate.

## Repo layout

```
car-match/
├── AGENTS.md            # this file
├── render.yaml          # LEGACY — Render spec, kept for history. Do not use for deploys.
├── .github/workflows/   # deploy-frontend.yml, keep-warm.yml, npm-audit.yml, zap-baseline.yml, codeql-analysis.yml
├── backend/             # Express API  (see backend/AGENTS.md)
├── frontend/            # React SPA    (see frontend/AGENTS.md)
├── docs/                # API.md, DEPLOYMENT.md, TechStack.md, FILE_OVERVIEW.md, logs, research, designs
├── scripts/             # setup-dev-https.sh, update_roadmap.sh, zap/
└── certs/               # dev TLS certs (gitignored)
```

## Local dev

Prereqs: Node 18 (see `.nvmrc`).

```bash
# Backend (defaults to in-memory; add MONGODB_URI to persist)
cd backend && npm i && node server.js         # http://localhost:3001

# Frontend
cd frontend && npm i && npm start             # http://localhost:3000
```

Frontend dev API base URL: set `REACT_APP_API_BASE_URL` in `frontend/.env.development.local` (see `.env.development.sample`). Default fallback is `http://localhost:3001`.

Local HTTPS: `./scripts/setup-dev-https.sh` then start backend with `DEV_HTTPS=true DEV_HTTPS_CERT=../certs/dev/server.crt DEV_HTTPS_KEY=../certs/dev/server.key`.

## Common commands

| Task | Command |
| --- | --- |
| Run backend | `cd backend && node server.js` |
| Run frontend | `cd frontend && npm start` |
| Build frontend | `cd frontend && npm run build` |
| Deploy frontend (Pages) | push to `main` (workflow auto-runs) or `cd frontend && npm run deploy` |
| Audit deps | `npm run audit` (in `backend/` or `frontend/`) |
| Build backend image | `gcloud builds submit ./backend --tag us-central1-docker.pkg.dev/car-match-prod-bm/car-match/backend:latest --project=car-match-prod-bm` |
| Deploy backend (Cloud Run) | see `docs/DEPLOYMENT.md` |
| Keep-warm status | Actions tab → "Keep Cloud Run Warm" workflow |

## Environment variables

**Backend (Cloud Run / local):**
- `JWT_SECRET` — required in production. Strong random string.
- `TOKEN_VERSION` — default `1`. Bump to invalidate all existing tokens.
- `ALLOWED_ORIGINS` — CSV of allowed CORS origins, e.g. `https://bradleymatera.github.io,http://localhost:3000`.
- `MONGODB_URI` — optional Atlas URI (URL-encode special chars in the password). When unset, backend uses in-memory stores.
- `NODE_ENV` — `production` in Cloud Run.
- `PORT` — Cloud Run sets this (default `8080`); server listens on it.
- `LOG_LEVEL` — `info` prod, `debug` local.
- `LOG_TO_CONSOLE` — set `true` on Cloud Run so logs go to stdout (captured by Cloud Logging).
- `LOG_DIR` — `/tmp/logs` on Cloud Run (ephemeral fs).
- `DISABLE_RATE_LIMIT` — `1` only for local load testing.

**Frontend (build time, GitHub Pages):**
- `REACT_APP_API_BASE_URL` — backend URL (the Cloud Run `*.run.app` URL). Set as a GitHub repo **variable** (Settings → Secrets and variables → Actions → Variables).
- `REACT_APP_USE_REAL_EVENTS=true` — fetch events from backend.

## Git workflow

- `main` = production. `dev` = integration. Feature branches off `dev`, PR into `dev`, `dev` → `main` for releases.
- Frontend deploys from `main` only (`.github/workflows/deploy-frontend.yml`).
- Hotfixes may merge to `main` directly.

## Conventions

- **No new comments** unless asked; preserve existing comments when editing.
- Plain CSS (no Tailwind). Component-scoped `.css` files per component dir.
- Functional React + hooks. `AuthContext` for session. `api/client.js` is the only place that talks to the backend — add new endpoints there, do not `fetch` directly from components.
- Backend routes are feature-oriented (auth, users, messages, events, forums, stats, admin) all in `server.js`. Models in `backend/models/`. Middleware in `backend/middleware/`.
- Security: never log secrets; `JWT_SECRET` must not be committed. CORS is allow-list based. Rate limits stay enabled in prod.

## Verification before considering work done

- `cd backend && node server.js` starts cleanly; `GET /healthz` returns 200.
- `cd frontend && npm run build` succeeds.
- If you changed backend routes, hit them with curl against a running server.
- If you changed the frontend, `npm run build` must pass; run `npm test` if tests exist for the touched component.
- After backend deploy: confirm `https://<run-url>/healthz` returns `{"status":"ok"}`.
- After frontend deploy: confirm the live Pages site can log in without multi-minute waits.

## Gotchas

- The frontend bakes `REACT_APP_API_BASE_URL` at build time. Changing the backend URL requires a new Pages build (push to `main` or manual workflow run).
- Mixed content: GitHub Pages is HTTPS, so the backend MUST be HTTPS. Cloud Run provides HTTPS automatically — do not point the frontend at an HTTP backend URL or browsers will block the requests.
- In-memory backend stores reset when the Cloud Run instance is replaced (deploys, or rare scale-down). For durable data, set `MONGODB_URI`.
- `bcrypt` is a native module; the Dockerfile installs build tools as a fallback if no prebuilt binary matches the image arch.
