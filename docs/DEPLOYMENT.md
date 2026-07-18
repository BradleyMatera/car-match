Deployment Guide

Overview
- Frontend: Deployed to GitHub Pages via GitHub Actions.
- Backend: Hosted on Google Cloud Run (free tier) as a container. GitHub Pages cannot host a backend.
- Keep-warm: A GitHub Actions workflow pings `/health` every 5 minutes so the Cloud Run instance stays warm and users never hit a cold start.

Frontend (GitHub Pages)
- Workflow: `.github/workflows/deploy-frontend.yml`
- Repo Variables (Settings → Secrets and variables → Actions → Variables):
  - `REACT_APP_API_BASE_URL`: your backend base URL (the Cloud Run `*.run.app` URL)
  - `REACT_APP_USE_REAL_EVENTS=true`: fetch events from backend (mock kept for demo richness otherwise)
  - `CLOUD_RUN_URL`: same backend URL, used by the keep-warm workflow
- Deploys from `main` only. You can also trigger a manual run via Actions (workflow_dispatch).
- App URL: `https://bradleymatera.github.io/car-match/`

Backend (Google Cloud Run)

Prerequisites:
- A GCP project with billing enabled (the free tier requires a billing account on file but does not charge as long as you stay within limits).
- `gcloud` CLI authenticated with permissions on the project.
- Google Cloud APIs enabled: `run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`.

One-time setup:
1) Create (or pick) a GCP project and link billing:
   ```
   gcloud projects create car-match-prod-bm --name="Car Match Prod"
   gcloud billing projects link car-match-prod-bm --billing-account=<BILLING_ACCOUNT_ID>
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project=car-match-prod-bm
   ```
2) Create an Artifact Registry Docker repo:
   ```
   gcloud artifacts repositories create car-match \
     --repository-format=docker --location=us-central1 --project=car-match-prod-bm
   gcloud auth configure-docker us-central1-docker.pkg.dev --project=car-match-prod-bm
   ```

Deploy (build + push + run):
3) Build and push the image (Cloud Build builds the `backend/Dockerfile` in GCP):
   ```
   gcloud builds submit ./backend \
     --tag us-central1-docker.pkg.dev/car-match-prod-bm/car-match/backend:latest \
     --project=car-match-prod-bm
   ```
4) Create an env-vars file (gitignored) so values with commas survive intact. Example `.deploy/env.yaml`:
   ```
   NODE_ENV: production
   TOKEN_VERSION: "1"
   LOG_TO_CONSOLE: "true"
   LOG_DIR: /tmp/logs
   ALLOWED_ORIGINS: "https://bradleymatera.github.io,http://localhost:3000,https://localhost:3000"
   JWT_SECRET: "<strong random secret>"
   ```
   (Optional) `MONGODB_URI: "mongodb+srv://USER:ENCODED_PASS@cluster/car-match?retryWrites=true&w=majority"` to enable persistence. Without it the backend runs on in-memory stores.
5) Deploy:
   ```
   gcloud run deploy car-match-backend \
     --image us-central1-docker.pkg.dev/car-match-prod-bm/car-match/backend:latest \
     --region us-central1 --allow-unauthenticated --port 8080 \
     --memory 512Mi --cpu 1 --concurrency 80 --max-instances 3 --timeout 60 \
     --env-vars-file .deploy/env.yaml \
     --project car-match-prod-bm
   ```
6) Note the returned `Service URL` (e.g. `https://car-match-backend-<number>.us-central1.run.app`).
7) In your GitHub repo, set the `REACT_APP_API_BASE_URL` and `CLOUD_RUN_URL` variables to that URL.

Keep-warm (avoids cold starts):
- `.github/workflows/keep-warm.yml` runs every 5 minutes (`cron: "*/5 * * * *"`), hitting `<CLOUD_RUN_URL>/health`.
- Requires the `CLOUD_RUN_URL` repo variable. ~8,640 requests/month, far under Cloud Run's 2M/month free tier.
- Note: use `/health`, NOT `/healthz`. Cloud Run's Google Front End reserves the exact `/healthz` path and returns its own 404 before traffic reaches the container. `/health` is an alias in `server.js` and is not reserved.

Free-tier limits to watch (Cloud Run):
- 2 million requests/month
- 360,000 vCPU-seconds/month
- 180,000 GiB-seconds/month
- 1 GB outbound data transfer/month (North America)
- `--max-instances 3` caps runaway scale. Stay within these and the card on file is not charged.

Local Development
- Backend: `cd backend && npm i && node server.js`
- Frontend: `cd frontend && npm i && npm start`
- By default, frontend uses `http://localhost:3001` as API. You can override with `.env` in `frontend`:
  - `REACT_APP_API_BASE_URL=http://localhost:3001`
  - `REACT_APP_USE_REAL_EVENTS=true` (optional)

Notes
- CORS is restricted via `ALLOWED_ORIGINS`. For local dev, localhost is allowed outside production.
- The backend is in-memory by default; set `MONGODB_URI` for durability. In-memory data resets when the Cloud Run instance is replaced (deploys, or rare scale-down past the keep-warm window).
- Health endpoint: `GET /health` returns `{ status: "ok", db: { connected: true|false } }`. (`/healthz` also exists but is intercepted by Cloud Run's GFE — use `/health` for monitoring.)
- The frontend bakes `REACT_APP_API_BASE_URL` at build time. Changing the backend URL requires a new Pages build (push to `main` or manual workflow run).
- Mixed content: GitHub Pages is HTTPS, so the backend must be HTTPS. Cloud Run provides HTTPS automatically — never point the frontend at an HTTP backend URL.
