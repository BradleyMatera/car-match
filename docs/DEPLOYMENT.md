Deployment Guide

Overview
- Frontend: Deployed to GitHub Pages via GitHub Actions.
- Backend: Host on a Node-friendly platform (e.g., Render, Railway, Fly.io). GitHub Pages cannot host a backend.

Frontend (GitHub Pages)
- Workflow: `.github/workflows/deploy-frontend.yml`
- Repo Variables (Settings → Secrets and variables → Actions → Variables):
  - `REACT_APP_API_BASE_URL`: your backend base URL (Render)
  - `REACT_APP_USE_REAL_EVENTS=true`: fetch events from backend (mock kept for demo richness otherwise)
- On push to `main`, `prod`, or `stage`, the workflow builds `frontend` and deploys `frontend/build`.
- App URL: `https://bradleymatera.github.io/car-match/`

Backend (Render example)
1) Push repo to GitHub (ensure `backend/package.json` has `start` script; it does).
2) Create a Render account and add a new Web Service from this repo.
   - Root directory: `backend`
   - Build command: `npm ci`
   - Start command: `npm start`
   - Health Check Path: `/healthz`
   - Health Check Path: `/`
   - Environment:
     - `JWT_SECRET` (required; strong secret string)
     - `TOKEN_VERSION` (optional; default `1`. Bump to force re-login after rotations)
     - `ALLOWED_ORIGINS` (comma-separated list of allowed origins; e.g., `https://bradleymatera.github.io,https://bradleymatera.github.io/car-match`)
     - `MONGODB_URI` (e.g., `mongodb+srv://USERNAME:PASSWORD@car-match.ehzw3qa.mongodb.net/car-match?retryWrites=true&w=majority&appName=car-match`)
       - IMPORTANT: URL‑encode special characters in the password (e.g., `!` -> `%21`).
3) Deploy. Note the generated URL, e.g., `https://car-match-h2gw.onrender.com`.
4) In your GitHub repo, set `REACT_APP_API_BASE_URL` variable to this URL to wire the frontend.

Local Development
- Backend: `cd backend && npm i && node server.js`
- Frontend: `cd frontend && npm i && npm start`
- By default, frontend uses `http://localhost:3001` as API. You can override with `.env` in `frontend`:
  - `REACT_APP_API_BASE_URL=http://localhost:3001`
  - `REACT_APP_USE_REAL_EVENTS=true` (optional)

Notes
- CORS is restricted via `ALLOWED_ORIGINS`. For local dev, localhost is allowed outside production.
- The backend is in-memory; use a persistent DB for durability.
  - Forums now persist using MongoDB when `MONGODB_URI` is provided; otherwise they run in-memory.
 - Health endpoint: `GET /healthz` returns `{ db: { connected: true|false } }`.
