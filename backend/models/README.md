# Mongoose Models

Schema definitions backing the Express API.

```mermaid
graph TD
  Models[models/] --> User[user.js]
  Models --> Event[event.js]
  Models --> Message[message.js]
  Models --> Forum[forum.js]
  Forum --> Thread[ForumThread]
  Forum --> Post[ForumPost]
```

- `user.js` — full profile schema (preferences, activity metadata, car collection) with partial unique email index.
- `event.js` — event listings, RSVPs, testimonials, and optional link to forum threads.
- `message.js` — messaging records between users including premium flags and read state.
- `forum.js` — thread/post schemas powering forum categories; exports `{ ForumThread, ForumPost }` models.
