# Car Match Installation & Deployment Guide
Last updated: Oct 2025 · Branch: `handoff/final-week4`

Follow this guide to stand up Car Match locally, prepare a staging environment, and promote to production (GitHub Pages + Render). Keep `handoff/MAINTENANCE_PLAN.md` nearby for ongoing operations.

## 1. Prerequisites
- macOS/Linux/Windows shell access with Git.
- Node.js 18.x and npm 10.x (`nvm use` respects `.nvmrc`).
- Optional: MongoDB Atlas account (or local Mongo) for persistent forums/events.
- Render (or another Node-capable host) for the backend.
- Access to GitHub repository and Actions secrets for deployment.

## 2. Clone the Repository
```bash
git clone https://github.com/BradleyMatera/car-match.git
cd car-match
git checkout handoff/final-week4
```

To create a clean archive without Git metadata, run `./scripts/package-handoff.sh` (see Section 7).

## 3. Environment Configuration
### Backend (`backend/`)
Create `backend/.env` (never commit) with:
```ini
PORT=3001
JWT_SECRET=replace-with-strong-secret
TOKEN_VERSION=1
ALLOWED_ORIGINS=https://<your-pages-url>,http://localhost:3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/car-match?retryWrites=true&w=majority&appName=car-match
LOG_LEVEL=info
LOG_RETENTION_DAYS=14
```
Optional for HTTPS dev:
```
DEV_HTTPS=true
DEV_HTTPS_CERT=../certs/dev/server.crt
DEV_HTTPS_KEY=../certs/dev/server.key
```

### Frontend (`frontend/`)
Copy `.env.development.sample` to `.env.development.local`:
```ini
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_USE_REAL_EVENTS=true
```
For production builds, set repository variable/secret `REACT_APP_API_BASE_URL` in GitHub → Settings → Secrets and variables → Actions.

## 4. Local Setup
```bash
# Backend
cd backend
npm install
npm run lint   # optional: ESLint security rules
npm run audit  # optional: vulnerability check
node server.js

# Frontend (new terminal)
cd ../frontend
npm install
npm start
```
The React dev server will proxy API requests to `http://localhost:3001`.

## 5. Database & Seed Data
1. Provision MongoDB Atlas (Shared tier is fine) or run local Mongo.
2. Update `MONGODB_URI` in backend `.env`.
3. Seed starter data:
   ```bash
   cd backend
   node scripts/seedFromMock.js
   ```
   The script loads mock users, events, and forum threads from `backend/seed/`.
4. Verify connection by hitting `GET http://localhost:3001/healthz` (should report `connected: true`).

Forums fall back to in-memory storage if `MONGODB_URI` is omitted; data resets on restart.

## 6. Testing & Smoke Checks
- Frontend tests: `cd frontend && npm test`
- Backend health check: `curl http://localhost:3001/healthz`
- Manual smoke: register/login, create event, send message, browse forums.
- Security scan (optional): `./scripts/zap/zap-baseline.sh https://<render-app>.onrender.com`

## 7. Packaging for Submission
Use the helper script to produce a clean archive with all assets (code, docs, marketing materials):
```bash
./scripts/package-handoff.sh --format tar.gz   # default
./scripts/package-handoff.sh --format zip      # alternate
```
Output files land in `dist/` (ignored by git). Attach the archive to LMS or share with operations as required.

## 8. Deployment
### Backend (Render)
1. Create new Web Service from this repo.
   - Root directory: `backend`
   - Build command: `npm ci`
   - Start command: `npm start`
   - Health check path: `/healthz`
2. Configure environment variables (Section 3) inside Render dashboard.
3. Enable auto-deploy on pushes to `main` (or trigger manually after QA).
4. After deploy, note the base URL (e.g., `https://car-match.onrender.com`).

### Frontend (GitHub Pages)
1. Ensure `REACT_APP_API_BASE_URL` repository variable matches Render URL.
2. Merge/test changes on `dev`, PR into `main`.
3. GitHub Action `.github/workflows/deploy-frontend.yml` builds and publishes to Pages under `https://<username>.github.io/car-match/`.
4. Validate SPA by visiting the site and running the smoke checks outlined above.

### Optional Staging
- Use the `staging` branch to deploy to a secondary Render service or Vercel preview.
- Override environment variables with staging credentials.

## 9. Post-Install Tasks
- Update `docs/2025-09.md` (or successor) with deployment notes.
- Notify moderators (see `docs/moderation-roles-plan.md`) about environment changes.
- Kick off marketing launch checklist in `Marketing/` if this is a public release.
- Schedule next maintenance review per `handoff/MAINTENANCE_PLAN.md`.

## 10. Troubleshooting Resources
- `docs/TROUBLESHOOTING.md` — common errors and resolutions.
- `docs/SECURITY-NOTES.md` — rate-limit settings, auth hardening.
- `docs/DEPLOYMENT.md` — additional Render/Page references.
- `docs/log2.md` — historical issues and their fixes (Week 3 log).

Keep this guide updated as infrastructure evolves. Update the header date and GitHub Actions secrets whenever you rotate credentials or move hosting providers.

