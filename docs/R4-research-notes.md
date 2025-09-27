## R4 Execution Plan
### EPIC #64 — Events: Ownership & User Linkage
Problem:
Legacy events seeded before Mongo integration often lack `createdByUserId` / `createdByUsername`, so organizer permissions, RSVP ownership, and automatic forum thread linkage are unreliable. The UI currently guesses ownership based on `selectedEvent.createdByUserId`, which is undefined for many records.
Proposed Design:
- Backend: Promote `createdByUserId` to an ObjectId ref in `backend/models/event.js`, enforce presence in `POST /events`, and normalize via `normalizeEvent` in `backend/server.js` so the API always emits organizer metadata. Extend `/admin/backfill-events-users` plus `backend/scripts/seedFromMock.js` to crosswalk legacy mock data to real `User` docs and ensure `threadId` exists for each event.
- Frontend: Update `frontend/src/api/client.js` normalization and `Events` component to rely on the returned organizer metadata, gate edit/delete controls with `AuthContext`, and surface a direct link that calls `/events/:id/ensure-thread` when needed. Profile views reuse the normalized payload for organizer sections.
Risks:
- Backfill may encounter orphaned organizers not present in Mongo; need safe fallbacks and logging.
- Tightening schema could break integrations if third-party seeds omit organizer info.
- Forum thread creation introduces race conditions when multiple requests try to ensure threads concurrently.
Test Plan:
- Seed dev Mongo, run `POST /events` and `PUT /events/:id` as owner and non-owner, verifying 403/200 behavior and persisted organizer refs.
- Execute `node backend/scripts/seedFromMock.js` followed by `/admin/backfill-events-users` to confirm summary counts and normalized data returned by `GET /events` and `GET /events/:id`.
- In the UI, login as organizer vs attendee to validate gated buttons, ensure `ensure-thread` call succeeds for legacy events, and confirm RSVP/comment moderation respects ownership.
Rollout:
- Land schema + API changes first, then run backfill script in staging with logging.
- Ship frontend Organizer UI behind milestone PR `dev → staging`; smoke test before merging staging → main after instructor approval.

Research notes (2025-09-27):
- `backend/models/event.js` still stores `createdByUserId` as a `Schema.Types.Mixed` without `ref`/`required`. Legacy mock data therefore persists numeric IDs or `undefined`, which breaks downstream owner checks.
- `backend/scripts/seedFromMock.js` copies organizer fields verbatim from historical arrays; `backfillEventsUsers` (`backend/server.js:295-337`) compensates but falls back to the first user when lookups fail, silently reassigning ownership.
- UI ownership affordances rely on these fields (`frontend/src/components/Events/index.js:20-22`); when the backend omits them, organizers see “Unknown” labels and lose Manage Event controls.
- Discussion CTA never writes the ensured `threadId` back into component state (`Events/index.js:212-221`), so organizers repeatedly trigger `/ensure-thread`.

### EPIC #63 — Forums: Moderation & Roles
Problem:
Moderator actions currently depend on the `developerOverride` flag; there is no durable `role`, so any user with override bypasses access controls. UI renders pin/lock/delete controls for any logged-in member, creating broken access control risks.
Proposed Design:
- Backend: Constrain `User.role` enum in `backend/models/user.js`, propagate role via `sanitizeUser` and JWT payload, and add admin route (`PUT /admin/users/:userId/role`) plus seed defaults in `backend/scripts/seedFromMock.js`. Update forum endpoints in `backend/server.js` to require moderator/admin roles, expand security logging, and tune rate limiters for elevated actors.
- Frontend: Persist `role` inside `AuthContext`, expose helper selectors for moderator/admin checks, and conditionally render moderation controls in `frontend/src/components/Forums/index.js` with badges and locked-thread UX. API client handles 403 responses with clear messaging.
Risks:
- Existing sessions without the new `role` might fail until users re-authenticate.
- Misconfigured seed data could leave the app without any moderator/admin actor.
- Expanded logging/rate-limiting must avoid leaking sensitive data or blocking legitimate moderators.
Test Plan:
- Promote a user to moderator via the new admin endpoint, verify `GET /users/me` and JWT include `role`, and run moderation actions to ensure 403 vs 200 responses align with role.
- Exercise rate limits by performing repeated moderation calls, confirming new caps and audit logs in `backend/logger` outputs.
- In the frontend, login as moderator/admin vs regular user to validate conditional rendering, badge styling, and locked-thread messaging; run unit/manual smoke tests for regression coverage.
Rollout:
- Deploy backend role schema + enforcement first, then seed moderators and have them re-login to pick up tokens.
- Ship frontend UI update via milestone PR, coordinate instructor review (#14) before promoting staging → main, and document role assignment SOP in weekly log.

Research notes (2025-09-27):
- Forum moderation today hinges on `developerOverride`; `User.role` is free-form text with no validation, so true RBAC does not exist.
- The Events UI consumes organizer data but offers no moderator affordances—front-end changes will need fresh role information from `AuthContext` once backend emits it.
- Project board needs dedicated cards for moderator assignment tooling and logging updates (see issues #123–#128) to track the incremental rollout.
