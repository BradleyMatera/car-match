# Moderation Roles Rollout Plan

Source research: see `docs/research/R4-Notes.md` – [Moderation & Role Handling Research (#121)](./research/R4-Notes.md#moderation--role-handling-research-121) and [Forums UI Moderator Audit (#122)](./research/R4-Notes.md#forums-ui-moderator-audit-122).

## Objectives

- Persist explicit `role` metadata (`user`, `moderator`, `admin`) for every member and expose it via JWT/session flows.
- Enforce role checks for all forum moderation actions with structured logging/rate limiting.
- Deliver an intuitive moderator UI (badges, toolbars, feedback) that only appears for authorized users.

## Backend Delivery

- **User model** (`backend/models/user.js`):
  - Added `role` enum with supporting index; defaults to `user`.
  - Ensured `UserSchema` serialization strips sensitive fields but retains role data for downstream clients.
- **Role assignment utility** (`backend/server.js`):
  - `PUT /admin/users/:userId/role` allows admins/developer overrides to promote/demote roles with validation and `securityEvent` logging.
  - `GET /users/me` hydrates role information from Mongo to sync client state after promotions.
- **Moderation guards** (`backend/server.js` forums routes):
  - Pin/lock/delete endpoints require `moderator` or `admin` role; unauthorized attempts return `403` and are logged.
  - Added rate limiting (via `express-rate-limit`) to destructive endpoints and expanded log metadata (actor, target thread/post, requestId).
- **Audit logging** (`backend/logger`):
  - Standardized moderation log entries to feed future dashboards or alerting.

## Frontend Delivery

- **API client** (`frontend/src/api/client.js`):
  - JWT login/current-user flows now surface `role` and expose moderation endpoints.
  - Forums APIs return normalized thread/post shapes, simplifying badge rendering.
- **Auth context** (`frontend/src/context/AuthContext.js`):
  - Persists role value alongside user data, updating local storage after promotions.
- **Forums UI** (`frontend/src/components/Forums/index.js` & `Forums.css`):
  - Shows moderator/admin badges next to usernames.
  - Renders moderation toolbar (Pin/Unpin, Lock/Unlock, Delete) only when `currentUser.role !== 'user'`.
  - Locks reply composer when a thread is locked and surfaces status messaging for all viewers.
  - Provides success/error toasts after actions and syncs state with refreshed thread data.

## Operational Checklist

1. **Promote a moderator**: `curl -X PUT https://car-match-h2gw.onrender.com/admin/users/<id>/role -H "Authorization: Bearer <admin-token>" -H "Content-Type: application/json" -d '{"role":"moderator"}'`.
2. **Validate API responses**: Fetch `GET /users/me` to confirm role propagation; hit `/forums/...` endpoints as moderator vs standard user to verify 200/403 behavior.
3. **UI smoke test**:
   - Login as moderator: confirm badges & toolbar appear, actions succeed, and locked threads hide composer.
   - Login as standard user: ensure badges visible but no toolbar, locked threads show read-only notice.
4. **Review logs**: Confirm `securityEvent` entries capture moderation actions and rate limiter logs note bursts.
5. **Run automated tests**: `CI=true npm test -- --watch=false` (ensures Auth/Forums components render with new role data).

Following this plan keeps moderator capabilities aligned with backend enforcement and gives stakeholders confidence prior to production sign-off.
