Backend: Node/Express API

Overview
- Express 5 server with JWT authentication, messaging, events, and forums endpoints.
- Forums persist to MongoDB if `MONGODB_URI` is set; otherwise endpoints return "Database not available".

Run locally
- Node 18 recommended
- `cd backend && npm i && node server.js`
- Optional: enable local HTTPS
  - Generate cert/key via `../scripts/setup-dev-https.sh`
  - Start with `DEV_HTTPS=true DEV_HTTPS_CERT=../certs/dev/server.crt DEV_HTTPS_KEY=../certs/dev/server.key node server.js`

Environment variables
- `JWT_SECRET` (string): required in non‑development
- `TOKEN_VERSION` (string/number): default `1`; bump to invalidate old tokens
- `ALLOWED_ORIGINS` (csv): e.g., `https://bradleymatera.github.io,http://localhost:3000`
- `DISABLE_RATE_LIMIT` (booly string, default `false`): set to `true` only when intentionally disabling rate limiting for local testing
- `MONGODB_URI` (string, optional): Atlas URI including db name and URL‑encoded password, e.g.
  `mongodb+srv://user:ENCODED_PASS@cluster.mongodb.net/car-match?retryWrites=true&w=majority&appName=car-match`

Key endpoints
- Auth: `POST /register`, `POST /login`, `GET /protected`
- Messages: `POST /messages`, `GET /messages/inbox?category=...&filterGender=&filterRadius=&sortBy=`
- Events: `GET /events`, `POST /events` (auth), `POST /events/:eventId/rsvp` (auth)
- Forums: `GET /forums/categories`, `GET /forums/categories/:categoryId/threads`,
  `POST /forums/threads` (auth), `GET /forums/threads/:threadId`, `POST /forums/threads/:threadId/posts` (auth),
  `PATCH /forums/threads/:threadId/pin|lock` (auth), `DELETE /forums/threads/:threadId` (auth), `POST /forums/posts/:postId/report` (auth)

Security notes
- CORS restricted via `ALLOWED_ORIGINS`
- JWT secret required in production; token payload includes `tokenVersion`
