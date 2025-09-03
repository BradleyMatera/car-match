Deployment Guide

Overview
- Frontend: Deployed to GitHub Pages via GitHub Actions.
- Backend: Host on a Node-friendly platform (e.g., Render, Railway, Fly.io). GitHub Pages cannot host a backend.

Frontend (GitHub Pages)
- The repo includes a workflow: `.github/workflows/deploy-frontend.yml`.
- Configure repo Variables (Settings → Secrets and variables → Actions → Variables):
  - `REACT_APP_API_BASE_URL`: Your deployed backend base URL, e.g., `https://your-service.onrender.com`.
  - `REACT_APP_USE_REAL_EVENTS`: Set to `true` to fetch events from backend, or leave empty/false to use richer mock events.
- On push to `main`, the workflow builds `frontend` and deploys `frontend/build` to the `gh-pages` branch.
- The site will be served at: `https://bradleymatera.github.io/car-match`.

Backend (Render example)
1) Push repo to GitHub (ensure `backend/package.json` has `start` script; it does).
2) Create a Render account and add a new Web Service from this repo.
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: add `JWT_SECRET` (any strong secret string)
3) Deploy. Note the generated URL, e.g., `https://car-match-backend.onrender.com`.
4) In your GitHub repo, set `REACT_APP_API_BASE_URL` variable to this URL to wire the frontend.

Local Development
- Backend: `cd backend && npm i && node server.js`
- Frontend: `cd frontend && npm i && npm start`
- By default, frontend uses `http://localhost:3001` as API. You can override with `.env` in `frontend`:
  - `REACT_APP_API_BASE_URL=http://localhost:3001`
  - `REACT_APP_USE_REAL_EVENTS=true` (optional)

Notes
- CORS is enabled wide-open in the backend for simplicity. Lock it down for production.
- The backend is in-memory; use a persistent DB for durability.
