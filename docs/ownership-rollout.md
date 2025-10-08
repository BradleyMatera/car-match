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
  - Preload RSVP state from `/my-rsvps` and refresh event details after mutations to keep owner data fresh.
- **Styling** (`frontend/src/components/Events/Events.css`):
  - Introduced organizer badge styles and locked/owner cues for cards and drawers.

## Operational Checklist

1. **Backfill legacy data**: `curl -X POST https://car-match-h2gw.onrender.com/admin/backfill-events-users -H "Authorization: Bearer <token>"`.
2. **Smoke test ownership paths**:
   - Login as an organizer and verify edit/delete/RSVP controls.
   - Login as a non-owner and confirm controls are hidden/disabled.
   - Ensure forum threads open from the Events drawer.
3. **Run automated tests**: `CI=true npm test -- --watch=false`.
4. **Monitor logs**: Tail Render logs for `securityEvent` entries during the smoke test to confirm guardrails fire.

With the above in place, deployments to Render/Pages inherit ownership enforcement automatically.
