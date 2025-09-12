# Car Match — Documentation

Car Match is a community app for car enthusiasts — events, forums, messaging, and profiles. This repo contains a working React frontend (deployed to GitHub Pages) and a Node/Express backend (deployable on Render) with optional MongoDB persistence for forums and other data.

## Tech Stack

- Frontend: React (CRA), React Router (HashRouter for Pages), plain CSS.
- Backend: Node.js + Express 5, JWT auth, CORS hardening.
- Database: MongoDB Atlas via Mongoose (forums persist when `MONGODB_URI` is set; otherwise in-memory).
- CI/CD: GitHub Actions deploys frontend to Pages; Render blueprint for backend.

## Key Links

- Live App: https://bradleymatera.github.io/car-match/
- API/Backend: see `docs/API.md`
- Deployment: `docs/DEPLOYMENT.md` (Pages + Render)
- Troubleshooting: `docs/TROUBLESHOOTING.md`
- Research & Change Orders: `docs/research/` (see `ChangeOrders.md`)
- Logs: `docs/log.md` (original, May), `docs/log2.md` (September), and monthly snapshot `docs/2025-09.md`

## Project Ops

- Project board helper: `scripts/update_project.sh` (adds issues to Project, helps update Status fields)
- Roadmap population (dates/status): see Project updates in the repo history; items have Start/End dates based on issue activity and sprint due dates.

## Status (September 2025)

- Pages deploys only from `main`.
- Forums persist in prod when MongoDB URI is correctly URL‑encoded and configured on Render.
- Week 2 focus: consolidate Settings into the Profile page; Profile UX polish; finalize forum persistence checks in prod.

## Notes

Standard workflow uses PRs into `dev` and promotion to `main`. GitHub Pages publishes from `main` only.
