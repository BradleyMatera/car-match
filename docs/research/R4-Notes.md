# Week 4 Research: Security and Compliance

## SWOT Analysis

### Strengths
- **Modern Tech Stack:** Our stack (MERN) has a large community and many security resources.
- **Modular Architecture:** The separation of frontend and backend can help isolate security issues.

### Weaknesses
- **Limited Security Expertise:** The team is small and lacks a dedicated security expert.
- **No Automated Security Testing:** We currently don't have automated security scanning in our CI/CD pipeline.

### Opportunities
- **Implement DevSecOps:** We can integrate security practices into our development process.
- **Open Source Tools:** We can leverage open-source security tools to improve our security posture.

### Threats
- **Outdated Dependencies:** Vulnerabilities in dependencies are a major threat.
- **Common Web Vulnerabilities:** We are susceptible to common attacks like XSS and CSRF without proper defenses.

## OWASP Top 10 Web App Security Risks

1.  **Broken Access Control:** We need to ensure that our role-based access control is properly implemented.
2.  **Cryptographic Failures:** We must use strong encryption for data in transit and at rest.
3.  **Injection:** We need to validate and sanitize all user input to prevent injection attacks.
4.  **Insecure Design:** Security should be a consideration from the start of the development process.
5.  **Security Misconfiguration:** We need to ensure that our servers and frameworks are securely configured.
6.  **Vulnerable and Outdated Components:** We must keep our dependencies up to date.
7.  **Identification and Authentication Failures:** We need to implement secure authentication and session management.
8.  **Software and Data Integrity Failures:** We need to protect against unauthorized modification of our code and data.
9.  **Security Logging and Monitoring Failures:** We need to implement robust logging and monitoring to detect security incidents.
10. **Server-Side Request Forgery (SSRF):** We need to validate all URLs and APIs that our server interacts with.

## Code Scanning with CodeQL: Alternatives

- **Snyk:** A popular tool that provides code scanning, dependency scanning, and container scanning.
- **SonarQube:** An open-source platform for continuous inspection of code quality to perform automatic reviews with static analysis of code to detect bugs, code smells, and security vulnerabilities.
- **Veracode:** A comprehensive AppSec platform that provides a wide range of security testing tools.

## Creativity & Innovation (EFF)

I reviewed the articles on the EFF's "Creativity & Innovation" page. A key takeaway is the importance of fair use and the dangers of overly broad copyright laws in stifling innovation. This is relevant to our project as we plan to allow users to upload content. We need to be mindful of copyright issues and have a clear policy on user-generated content.

## Event Ownership Flow Research (#111)

- **Current pain points:** Legacy Atlas documents allow `createdByUserId` to be `null` or mismatched (`"demoUser"` strings), which breaks organizer badges/edit permissions on the Events page and forces us to fall back to "Unknown Organizer".
- **Target data model:** Promote `createdByUserId` to a required `ObjectId` reference and persist the matching `createdByUsername`. RSVP/comment subdocuments should likewise store canonical user references.
- **Lifecycle mapping:**
  - `POST /events` captures `req.user.id` from the JWT and seeds `createdByUserId` / `createdByUsername`.
  - `PUT /events/:id` validates request ownership; only the organizer (or admin) can mutate fields.
  - `DELETE /events/:id` and RSVP/comment endpoints inherit the same guard.
- **Backfill approach:** Reuse `/admin/backfill-events-users` to merge historical seed data by username → userId, logging any failures. Events without resolvable owners are marked for manual review.
- **Thread linkage:** After a successful create/update, call `POST /events/:eventId/ensure-thread` so every event maintains a corresponding forum thread for discussions.

## Events UI Organizer Audit (#112)

- **Primary surfaces:** Event carousel cards, the detail drawer, and the call-to-action buttons (RSVP, Edit/Delete, "View Forum Thread").
- **Required updates:** Display organizer avatar + username, disable owner-only actions (RSVP, delete) for organizers, and ensure the detail drawer links to the associated thread.
- **Edge states:** When the event lacks a `threadId`, emit a call to `ensureEventThread` before rendering the forum link. For legacy events, trigger the backfill/on-demand ensure flow.
- **Telemetry:** Log analytics events when owners manage their listings to confirm the gating is effective once shipped.

## Moderation & Role Handling Research (#121)

- **Current state:** Only `developerOverride` toggles exist in seeded users; moderator actions are effectively unrestricted for anyone with direct API access.
- **Role model proposal:** Introduce `role` (`user`, `moderator`, `admin`) on the `User` schema with supporting indexes. Admins can promote/demote via `PUT /admin/users/:userId/role`.
- **Security hooks:** JWT payloads must include `role`; middleware should enrich `req.user.role` and emit structured audit logs (`moderation.action`, `moderation.actor`, `target.threadId`).
- **Rate limiting:** Apply stricter limits to destructive endpoints (`DELETE /forums/threads/:id`, `DELETE /forums/posts/:id`) and log bursts for review.

## Forums UI Moderator Audit (#122)

- **Moderator tooling:** Thread list headers require badges for pinned/locked posts, and the detail view needs a toolbar (Pin/Unpin, Lock/Unlock, Delete).
- **Conditional rendering rules:** Show badges and controls only when `currentUser.role` is `moderator`/`admin`. All others see read-only status indicators.
- **Feedback surfaces:** After an action, toast success/failure and optimistically update UI state. When a thread is locked, hide the reply composer and show a read-only notice.
- **Empty/error states:** Provide dedicated messaging when the user lacks privileges or when moderation actions fail (e.g., 403 responses) so support can triage quickly.
