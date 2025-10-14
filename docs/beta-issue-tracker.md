# Beta Audit Issue Tracker

_Source: external beta review of Car‑Match 0.2.0 (Ownership & Moderation Rollout)._

| # | Area | Symptom | Root Cause / Notes | Status | Fix / Next Step |
|---|------|---------|--------------------|--------|-----------------|
| 1 | Events API | “Error creating event” alert; modal falls back to inline form | JWT/session users still carried in‑memory numeric IDs. Mongoose expected `ObjectId`, so `/events` threw cast errors. | ✅ Fixed (`backend/server.js` now uses `computeNextEventId` + `syncEventCache`). | Confirm creation, drawer auto-open, and success toast in production. |
| 2 | RSVP | RSVP button no-ops; no counter change or toast | Same identifier bug as #1 caused `/events/:id/rsvp` to cast/500. | ✅ Fixed (same changes). | Verify RSVP / cancel flows update counts + UI feedback. |
| 3 | Auth/Profile | `/users/me` 500 → blank Profile tab; new logins sometimes “Invalid credentials” | Token stored numeric IDs; Mongo lookup failed, so hydrate crashed and cache wasn’t reconciled. | ✅ Fixed (login prioritises Mongo, user cache synced, token IDs canonical). | Smoke profile load, ensure edit/save works. |
| 4 | Forums | Forums surface blank; categories/threads missing | `GET /forums/categories` succeeded, but Profile/auth failure (see #3) short-circuited forum initialization. | ✅ Fixed via Auth/ObjectId work. | Confirm category list populates, thread open works after deploy. |
| 5 | UX | Create Event button easy to miss; hidden at bottom when modal fails | Modal only appears after API succeeds; error path drops focus to fallback form. | 🔄 In progress | Modal now opens immediately; follow-up: simplify manage drawer layout & add empty-state labels. |
| 6 | Beta Ops | Rate-limit feedback invisible to testers | Server logs captured hits, but UI lacked messaging when throttled. | 🔄 In progress | Thresholds eased (50 auth / 180 sensitive per window); remaining work: surface 429 toasts/client messaging. |
| 7 | Event management | Edit/Delete do nothing | Mongo lookups failed for string ids; responses didn’t refresh cache. | ✅ Fixed (`findEventByParam` accepts string ids, cache sync on update/delete). | Verify edits reflect instantly and delete toast removes card. |
| 8 | Forums UI | “New Thread” panel lacks submit button | UI regression—the modal only surfaced Cancel. | ⏳ Open | Add primary submit button hooked to `/forums/...` POST; smoke test creation. |

_Legend_: ✅ fixed locally (await deployment), ⏳ backlog / needs design, 🔄 under investigation.
