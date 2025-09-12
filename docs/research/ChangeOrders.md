# Change Orders — Activity 1.3 (Project Initiation)

Owner: Bradley Matera  
Date: 2025-09-12

This document tracks material scope or approach adjustments discovered during early execution. Each change order records rationale, impact, and status, and should map to a corresponding GitHub issue and milestone.

---

CO-001 — Fix MongoDB URI on Render
- Rationale: Production forums show “Database not available” due to malformed connection string.
- Action: Update `MONGODB_URI` (URL‑encode special characters), redeploy, verify `/healthz` returns `connected: true`.
- Impact: Enables persistent forums, threads, and posts in production.
- Status: Planned

CO-002 — Consolidate Settings into Profile
- Rationale: Settings are duplicated and disrupt navigation; target is a single cohesive Profile page.
- Action: Remove Settings from top nav; migrate account, preferences, notifications, privacy/security, payments, display/accessibility, connections, and danger zone into Profile sections.
- Impact: Cleaner UX and simpler IA; fewer routes.
- Status: In progress

CO-003 — Profile “My Events” Scope Correction
- Rationale: Section should show events created by or RSVP’d to by the user, not the full catalog.
- Action: Adjust UI and data fetch (already partially wired via `getUserEvents`/`getMyRsvps`).
- Impact: Accurate personal dashboard; reduces noise.
- Status: In progress

CO-004 — Moderation & Roles
- Rationale: Forums require moderation (pin/lock/delete) and admin tiering.
- Action: Introduce roles (admin/mod); enforce permissions on threads/posts beyond dev override; expose minimal UI affordances.
- Impact: Governance and safety; aligns with real-world expectations.
- Status: Planned

CO-005 — Event Ownership & Identity
- Rationale: Events should tie to real users (creator/organizer) rather than free-floating data.
- Action: Ensure `createdByUserId/Username` consistently set and visible; backfill when seeding; auto-create associated forum thread.
- Impact: Provenance, accountability, and cross-linking to discussions.
- Status: In progress

CO-006 — Issue, Project, and Milestone Hygiene
- Rationale: Ensure tracking reflects the work; automate where feasible.
- Action: File missing issues, align statuses on the project board, maintain weekly milestones, and associate PRs.
- Impact: Reliable project snapshot and smoother reviews.
- Status: Planned

CO-007 — Remove Stray File on Stage Branch
- Rationale: Accidental file `}` present in `stage` branch root.
- Action: Remove from `stage` (and any other branches, if present) via PRs.
- Impact: Repo hygiene; avoids build/docs confusion.
- Status: Planned

---

Process
- Each CO gets a GitHub issue labeled `change-order` and assigned to a milestone.
- PRs should reference the CO issue (`Fixes #<issue>`/`Refs #<issue>`); deployment notes recorded in the issue.
