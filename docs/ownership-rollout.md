# Events Ownership Rollout Plan

Source research: see `docs/research/R4-Notes.md` – [Event Ownership Flow Research (#111)](./research/R4-Notes.md#event-ownership-flow-research-111) and [Events UI Organizer Audit (#112)](./research/R4-Notes.md#events-ui-organizer-audit-112).

## Objectives

- Guarantee every event in Atlas references a real user (`createdByUserId`, `createdByUsername`) and expose that data consistently through the API client.
- Enforce organizer-only controls (edit, delete, RSVP) while surfacing organizer context in the frontend and linking each event to its forum thread.
- Provide operators with a repeatable process to backfill/verify ownership integrity ahead of deployments.

## Backend Delivery

- **Schema hardening** (`backend/models/event.js`):
  - Require `createdByUserId` (ObjectId) and `createdByUsername` fields; normalize RSVP/comment subdocuments to persist canonical user references.
  - Index owner fields so reporting/queries remain performant.
- **Route enforcement** (`backend/server.js`):
  - `POST/PUT/DELETE /events/:id` now pull the organizer from `req.user` and reject non-owners (`403 Forbidden`) unless the actor is an admin.
  - RSVP/comment endpoints reuse the organizer guard and emit `securityEvent` logs when violations occur.
  - Added `/events/:id/ensure-thread` helper that creates or returns the paired forum thread for downstream UI.
- **Identifier hygiene** (`backend/server.js`):
  - `computeNextEventId` and `syncEventCache` keep Mongo and the in-memory fallback collection aligned so new events receive unique sequential IDs and edits/deletes update both stores.
  - `findEventByParam` now resolves both numeric and string IDs, ensuring organizer checks fire for newly created Atlas documents.
- **Backfill utilities**:
  - `/admin/backfill-events-users` maps legacy seed data (username → userId), logging unresolved events for manual remediation.
  - `backend/scripts/seedFromMock.js` produces organizer-aware seed data so new environments start in a compliant state.

## Frontend Delivery

- **API client normalization** (`frontend/src/api/client.js`):
  - Normalize event payloads, ensuring owner IDs/usernames are strings and forum thread IDs are available.
  - Expose helper calls such as `ensureEventThread`, `rsvpToEvent`, and `cancelRsvp` that honor the organizer gating semantics.
- **Auth context** (`frontend/src/context/AuthContext.js`):
  - Persist the refreshed user payload (including role/ID) so organizer detection works across reloads.
- **Events UI updates** (`frontend/src/components/Events/index.js`):
  - Display organizer badges and disable organizer-only actions (RSVP, delete) for owners.
  - Ensure the drawer links to the forum thread, calling `ensureEventThread` when necessary.
  - Preload RSVP state from `/my-rsvps`, refresh event details after mutations, and surface inline toasts (`Event created…`, `Event details updated…`, `Event deleted`) so owners have immediate feedback.
- **Styling** (`frontend/src/components/Events/Events.css`):
  - Introduced organizer badge styles and locked/owner cues for cards and drawers.

## Operational Checklist

1. **Backfill legacy data**: `curl -X POST https://car-match-h2gw.onrender.com/admin/backfill-events-users -H "Authorization: Bearer <token>"`.
2. **Verify organizer workflows end-to-end**:
   - Create a fresh event from the modal; confirm it appears at the top of the list, the drawer opens automatically, and a success toast renders.
   - Edit the event title/description/location and confirm the drawer + carousel reflect changes immediately.
   - Delete the event and confirm the confirmation toast plus removal from the list.
3. **Check non-owner experience**: Sign in as a different user, ensure organizer controls are hidden/disabled, and confirm RSVP toggles/attendee counts continue to work.
4. **Run automated tests**: `CI=true npm test -- --watch=false`.
5. **Monitor logs**: Tail Render logs for `securityEvent` entries during the smoke test to confirm guardrails fire and investigate any unexpected 400/500 responses.

With the above in place, deployments to Render/Pages inherit ownership enforcement automatically.
