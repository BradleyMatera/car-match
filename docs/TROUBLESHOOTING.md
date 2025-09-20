Troubleshooting

Frontend (CRA dev server)
- Use Node 18 (see `.nvmrc`). On Node 22–23 you may see module resolution errors (core-js-pure, wds overlay). Switch with `nvm use` and reinstall `frontend`.
- If errors persist, install dev pins: `npm i -D core-js-pure@^3 webpack-dev-server@^4 html-webpack-plugin@^5`.
- HTTPS warnings: trust the self-signed cert from `scripts/setup-dev-https.sh` (add `certs/dev/server.crt` to your OS trust store) or use `chrome://flags/#allow-insecure-localhost` during setup.

Backend (Render)
- "FATAL: JWT_SECRET is required in production": Add `JWT_SECRET` env.
- CORS errors: Ensure `ALLOWED_ORIGINS` contains exact origins, e.g., `https://bradleymatera.github.io,http://localhost:3000`.
- Forums → "Database not available": Missing/invalid `MONGODB_URI`. Use a proper Atlas URI with db name and URL‑encoded password.
- Atlas auth: DB user must have `readWrite` on `car-match`; network access must allow your host (use `0.0.0.0/0` to verify first).
- HTTP 429 "Too Many Requests": You tripped rate limiting—slow down requests or (for local testing only) export `DISABLE_RATE_LIMIT=1` before running `node server.js`.
- Structured logs live under `backend/logger/logs/` (or `LOG_DIR`); tail security events with `tail -f backend/logger/logs/security-$(date +%F).log`.

Zsh: "event not found" when encoding passwords
- In zsh, `!` triggers history expansion inside double quotes. Solutions:
  - Escape: `node -e \"console.log(encodeURIComponent('YourP@ssw0rd\\!#'))\"`
  - Disable history expansion temporarily: `set +H` (re‑enable with `set -H`)
  - Use single‑quoted Node code and escape inner quotes: `node -e 'console.log(encodeURIComponent("YourP@ssw0rd!#"))'`

Project Board Script
- Requires `gh` with `project` scope and `jq`.
- Run: `bash scripts/update_project.sh` to pull current items and update statuses idempotently.
