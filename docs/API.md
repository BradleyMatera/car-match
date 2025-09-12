API Reference (Backend)

Base URL (prod): https://car-match-h2gw.onrender.com

Auth
- POST /register — { username, password, name, displayTag, gender, city, state }
- POST /login — { username, password } → { token, user... }
- GET /protected (auth) — returns current user basics

Users
- PUT /users/:userId/upgrade-to-premium (auth)
- PUT /users/:userId/toggle-dev-override (auth)

Messages
- POST /messages (auth) — { recipientUsername, text }
- GET /messages/inbox (auth) — query:
  - category=inbox|unread|sent|locked|system
  - filterGender=male|female|other
  - filterRadius=<miles>
  - sortBy=timestamp|proximity

Events
- GET /events
- GET /events/:eventId
- POST /events (auth) — { name, description, date, location }
- PUT /events/:eventId (auth)
- DELETE /events/:eventId (auth)
- POST /events/:eventId/rsvp (auth)
- DELETE /events/:eventId/rsvp (auth)
- GET /my-rsvps (auth)
- POST /events/:eventId/ensure-thread — ensures a forum thread exists and returns its id
- Comments (auth):
  - POST /events/:eventId/comments — { text }
  - PUT /events/:eventId/comments/:commentId — { text }
  - DELETE /events/:eventId/comments/:commentId

Forums
- GET /forums/categories
- GET /forums/stats — summary per category (threads/posts/latest)
- GET /forums/categories/:categoryId/threads?search=&page=&pageSize=
- POST /forums/threads (auth) — { categoryId, title }
- GET /forums/threads/:threadId — thread + posts (+event if linked)
- POST /forums/threads/:threadId/posts (auth) — { body }
- PATCH /forums/threads/:threadId/pin (auth) — { pinned: true|false }
- PATCH /forums/threads/:threadId/lock (auth) — { locked: true|false }
- DELETE /forums/threads/:threadId (auth)
- POST /forums/posts/:postId/report (auth)

Stats
- GET /stats/site — { users, threads, posts, events }

Auth header
- Authorization: Bearer <JWT>

Notes
- CORS is restricted via `ALLOWED_ORIGINS` on the server; allow host‑only origins (e.g., `https://bradleymatera.github.io`).
- JWT payload includes `tokenVersion`; tokens with older versions are rejected when `TOKEN_VERSION` is bumped.
