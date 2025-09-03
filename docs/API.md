API Reference (Backend)

Base URL (prod): https://car-match-h2gw.onrender.com

Auth
- POST /register — { username, password, name, displayTag, gender, city, state }
- POST /login — { username, password } → { token, user... }
- GET /protected (auth)

Messages
- POST /messages (auth) — { recipientUsername, text }
- GET /messages/inbox (auth) — query:
  - category=inbox|unread|sent|locked|system
  - filterGender=male|female|other
  - filterRadius=<miles>
  - sortBy=timestamp|proximity

Events
- GET /events
- POST /events (auth) — { name, description, date, location }
- POST /events/:eventId/rsvp (auth)
- GET /my-rsvps (auth)

Forums
- GET /forums/categories
- GET /forums/categories/:categoryId/threads?search=&page=&pageSize=
- POST /forums/threads (auth) — { categoryId, title }
- GET /forums/threads/:threadId
- POST /forums/threads/:threadId/posts (auth) — { body }
- PATCH /forums/threads/:threadId/pin (auth) — { pinned: true|false }
- PATCH /forums/threads/:threadId/lock (auth) — { locked: true|false }
- DELETE /forums/threads/:threadId (auth)
- POST /forums/posts/:postId/report (auth)

Auth header
- Authorization: Bearer <JWT>

Notes
- CORS is restricted by `ALLOWED_ORIGINS` on the server
- JWT payload includes `tokenVersion`; server rejects tokens with older versions

