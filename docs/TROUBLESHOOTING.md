Troubleshooting

Frontend (CRA dev server)
- Use Node 18 (see `.nvmrc`). On Node 22–23 you may see module resolution errors (core-js-pure, wds overlay). Switch with `nvm use` and reinstall `frontend`.
- If errors persist, install dev pins: `npm i -D core-js-pure@^3 webpack-dev-server@^4 html-webpack-plugin@^5`.
- HTTPS warnings: trust the self-signed cert from `scripts/setup-dev-https.sh` (add `certs/dev/server.crt` to your OS trust store) or use `chrome://flags/#allow-insecure-localhost` during setup.

Backend (Cloud Run)
- "FATAL: JWT_SECRET is required in production": Add `JWT_SECRET` env (set in the Cloud Run env-vars file / console).
- CORS errors: Ensure `ALLOWED_ORIGINS` contains exact origins, e.g., `https://bradleymatera.github.io,http://localhost:3000`.
- Forums → "Database not available": Missing/invalid `MONGODB_URI`. Use a proper Atlas URI with db name and URL‑encoded password. (Without it the backend runs on in-memory stores.)
- Atlas auth: DB user must have `readWrite` on `car-match`; network access must allow your host (use `0.0.0.0/0` to verify first).
- HTTP 429 "Too Many Requests": You tripped rate limiting—slow down requests or (for local testing only) export `DISABLE_RATE_LIMIT=1` before running `node server.js`. Auth endpoints now allow roughly **50** attempts every **5 minutes** and sensitive actions (~create/update/delete) allow **180** per **30 minutes**; exceeding those windows will still trigger banners/logs.
- `/healthz` returns a Google 404 page: Cloud Run's GFE reserves the exact `/healthz` path. Use `/health` instead (alias in `server.js`) for monitoring and the keep-warm pinger.
- Cold starts: Cloud Run scales to zero after ~10-15 min idle. The keep-warm workflow (`keep-warm.yml`) pings `/health` every 5 min to prevent this. If you disable it, the first request after idle may take ~1-5s.
- View logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=car-match-backend" --project=car-match-prod-bm --limit=50` (set `LOG_TO_CONSOLE=true` so app logs reach Cloud Logging).
- Structured logs locally live under `backend/logger/logs/` (or `LOG_DIR`); tail security events with `tail -f backend/logger/logs/security-$(date +%F).log`.
- npm audit workflow runs via GitHub Actions; failures indicate high-severity issues. Run `npm run audit` locally in `backend/` and `frontend/` to reproduce and resolve.

Zsh: "event not found" when encoding passwords
- In zsh, `!` triggers history expansion inside double quotes. Solutions:
  - Escape: `node -e \"console.log(encodeURIComponent('YourP@ssw0rd\\!#'))\"`
  - Disable history expansion temporarily: `set +H` (re‑enable with `set -H`)
  - Use single‑quoted Node code and escape inner quotes: `node -e 'console.log(encodeURIComponent("YourP@ssw0rd!#"))'`

Project Board Script
- Requires `gh` with `project` scope and `jq`.
- Run: `bash scripts/update_project.sh` to pull current items and update statuses idempotently.
