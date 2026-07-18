# AGENTS.md — frontend/

React 19 SPA (Create React App) deployed to GitHub Pages. See root `AGENTS.md` for the big picture.

## Run

```bash
npm i
npm start                      # http://localhost:3000
npm run build                  # production build to ./build
npm test                       # CRA test runner
```

## Layout

- `src/index.js` — React entry. `src/App.js` — root component, `HashRouter`, route table.
- `src/api/client.js` — **the only module that talks to the backend**. All 36 fetch calls live here. Add new endpoints here; do not `fetch` from components.
- `src/context/AuthContext.js` — session state (`currentUser`, `token`, `login`, `logout`, `updateCurrentUser`). Token + user persisted in `localStorage` (`authToken`, `currentUser`). Hydrates on mount via `api.getCurrentUser()`.
- `src/components/<Feature>/` — one folder per feature: `Home`, `Events`, `Forums`, `Profile`, `Messages`/`MessagesPage`, `Login`, `SignUp`, `Settings`, `Layout`/`LayoutExample`, plus design-system primitives (`Container`, `Flex`, `Grid`, `Section`, `Spacing`). Each has `index.js`, `<Feature>.css`, and usually a `README.md`.
- `src/utils/seo.js` — `applySEO({ title, description, canonical, jsonLd })` per page. `src/utils/analytics.js` — `trackPageView`.
- `public/` — `index.html`, manifest, robots.txt, static assets.

## Routing

`HashRouter` (so GitHub Pages works without server rewrites). Routes in `App.js`:
- Logged out: `/login`, `/signup`, everything else redirects to `/login`.
- Logged in: `/` (Discover/Home), `/events`, `/forums`, `/profile`, `/layout-example`.

## API base URL resolution (`src/api/client.js`)

Priority:
1. `process.env.REACT_APP_API_BASE_URL` (build-time, set as a GitHub repo variable for Pages builds).
2. If on `github.io` → the Cloud Run backend URL.
3. Else → `${protocol}//${hostname}:3001` (local dev).

Changing the backend URL = rebuild + redeploy the frontend (it's baked at build time).

## Env (build time)

- `REACT_APP_API_BASE_URL` — backend URL (Cloud Run `*.run.app`).
- `REACT_APP_USE_REAL_EVENTS=true` — use backend `/events`.
- `.env.development.sample` shows local HTTPS cert wiring.

## Deploy (GitHub Pages)

- Workflow: `.github/workflows/deploy-frontend.yml`. Runs on push to `main` + `workflow_dispatch`.
- Reads repo **variables** `REACT_APP_API_BASE_URL` and `REACT_APP_USE_REAL_EVENTS` at build time.
- Publishes `frontend/build` to the `gh-pages` branch via `peaceiris/actions-gh-pages`.
- Live URL: https://bradleymatera.github.io/car-match/
- Manual: `cd frontend && npm run deploy` (uses `gh-pages` package, requires `homepage` in `package.json` which is set).

## Conventions

- Plain CSS, component-scoped. No Tailwind. Global vars/resets in `src/global.css`.
- Functional components + hooks. Context for auth only.
- All backend calls go through `src/api/client.js`. Components consume `api.*` methods + read `currentUser`/`token` from `AuthContext`.
- Loading state: components that fetch should show a loading indicator (spinner/skeleton) — important because the backend is on Cloud Run and may have a rare ~1-5s cold start (mitigated by the keep-warm workflow).
- `eslint-plugin-security` with `security/detect-object-injection: error` is enabled — avoid dynamic property access patterns that trip it.

## Verification

- `npm run build` must succeed before pushing (CI also runs `npm audit`).
- If you change `api/client.js`, check every caller of the changed method.
- If you change routing in `App.js`, test both logged-out and logged-in states.
- After deploy: confirm the live site loads and can log in without multi-minute waits.
