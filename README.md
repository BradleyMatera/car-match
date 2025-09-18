# Car Match — Community MVP 🚗❤️

Live, working MVP for a car‑enthusiast community: profiles, events, forums, and messaging. Frontend runs on GitHub Pages; backend runs on Node/Express and can be deployed on Render with optional MongoDB persistence for forums.

## Overview

Frontend‑first build with mock interaction logic and seamless backend integration. Supports real auth/messages/events via backend; forums persist when a MongoDB URI is configured.

Owner: Bradley Matera — [Log](./docs/log.md) · New: [log2.md](./docs/log2.md)

## Community Features

- Events: browse upcoming community events and RSVP.
- Profiles: build out your profile, interests, and garage.
- Messaging: user-to-user messaging with premium gating and filters.
- Forums: categories, threads, and replies to foster discussion (mock-backed by default; persists when backend MongoDB is configured).

## Key Resources

- Live App: https://bradleymatera.github.io/car-match/
- Repo: https://github.com/BradleyMatera/car-match
- Deployment: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- API: [docs/API.md](./docs/API.md)
- Troubleshooting: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- Designs: [docs/designs](./docs/designs)
 - Health: `GET /healthz` on the backend returns service/db readiness
 - Current Monthly Log: [docs/2025-09.md](./docs/2025-09.md) and [docs/log2.md](./docs/log2.md)

## Project Management

I am actively using the GitHub Projects Kanban board to manage my work. While I may not use all available views (Backlog, Priority Board, etc.), the main Kanban board is the single source of truth for my current tasks and priorities. All work for a given milestone will be reflected in the project board.

## Git Workflow

My Git workflow is as follows:

1.  **Feature Branches:** All new work is done on a feature branch, branched off of `dev`.
2.  **Pull Requests:** When a feature is complete, I open a pull request to merge the feature branch into `dev`.
3.  **Merging:** Once the pull request is reviewed and approved, it is merged into `dev`.
4.  **Main Branch:** The `main` branch is reserved for stable, production-ready code. I merge `dev` into `main` when I am ready to deploy a new version of the application.

Any merges directly to `main` from feature branches are exceptions and are typically for hotfixes or minor documentation updates that do not affect the application's functionality.

## Quick Start (Local)

Prereqs: Node 18 (use `.nvmrc`).

1) Backend
   - `cd backend && npm i && node server.js`
   - Optional env: `JWT_SECRET=dev TOKEN_VERSION=1 MONGODB_URI=<mongo>`
2) Frontend
   - `cd frontend && npm i && npm start`

## Env & Toggles
- Frontend repo variables (Pages builds):
  - `REACT_APP_API_BASE_URL` — backend URL (e.g., Render)
  - `REACT_APP_USE_REAL_EVENTS=true` — use backend events
- Backend (Render):
  - `JWT_SECRET` (required in prod)
  - `TOKEN_VERSION=1`
  - `ALLOWED_ORIGINS= https://bradleymatera.github.io,http://localhost:3000`
  - `MONGODB_URI` (optional; enables forum persistence). Example:
    `mongodb+srv://USERNAME:PASSWORD@car-match.ehzw3qa.mongodb.net/car-match?retryWrites=true&w=majority&appName=car-match`.
    Remember to URL‑encode passwords (`!` becomes `%21`).

## Deploy Backend (Render)
[Docs](./docs/DEPLOYMENT.md) — or click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
