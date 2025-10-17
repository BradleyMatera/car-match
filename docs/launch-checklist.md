# Launch Checklist — CarMatch 0.2.0

This checklist captures the launch readiness items for the CarMatch beta-to-production rollout. Status values: ✅ complete, 🔄 in progress, ⚪ pending / not required.

| Area | Item | Status | Notes |
| --- | --- | --- | --- |
| Content | All core pages reviewed (Discover, Events, Forums, Profile, Login, Sign Up) | ✅ | Copy, imagery, and CTA placement validated against the [live site](https://bradleymatera.github.io/car-match/). Profile placeholders marked “Coming soon”. |
| Content | Launch announcement draft | ✅ | Final copy stored in [`docs/launch-checklist.md`](#launch-communication-template) and [Release 0.2.0 notes](https://github.com/BradleyMatera/car-match/releases/tag/0.2.0). |
| Content | Release notes & changelog | ✅ | GitHub release `0.2.0` published; high-level story summarized for stakeholders. |
| Functionality | User registration & login | ✅ | Session persistence confirmed; rate limiting relaxed to 50 attempts/5 min (see `backend/middleware/rateLimits.js`). |
| Functionality | Event creation | ✅ | Modal autofocus, success toast, new events injected + drawer auto-opens. Verified via [Render API](https://car-match-h2gw.onrender.com/events). |
| Functionality | Event edit/delete | ✅ | Organizer-only controls update Mongo + cache with success toast; verified with curl + UI regression. |
| Functionality | RSVP toggle | ✅ | “Processing…” state, badge toggle, attendee count refresh, non-owner lockouts verified. |
| Functionality | Forums | 🔄 | Categories/threads load; moderator tooling works. “New Thread” submit CTA planned for next patch (`frontend/src/components/Forums/index.js`). |
| Functionality | Profile dashboard | ✅ | Profile header, About, Garage/Events tabs render; edit/save flows deliver confirmation toast. |
| Functionality | Messaging/Garage placeholders | 🔄 | Tabs display “Coming soon” messaging until feature work completes. |
| Deployment | GitHub repository status | ✅ | [`main` branch](https://github.com/BradleyMatera/car-match/tree/main) clean; CI smoke (CRA tests/build) passing. |
| Deployment | GitHub Pages (frontend) | ✅ | `npm run deploy` pushed commit [`76e0033`](https://github.com/BradleyMatera/car-match/commit/76e00339b80ac347e94ac21457704ef3dc69e5a4). |
| Deployment | Render (backend) | ✅ | Service [`car-match-backend`](https://dashboard.render.com/web/srv-carmatch) running commit [`c5a4074`](https://github.com/BradleyMatera/car-match/commit/c5a4074ccda819d832fd4f5f2f7b90f882885ba3); `/healthz` returns connected. |
| Deployment | Rollback plan | ✅ | Git tag `v0.1.0` + Render snapshot bookmarked for emergency revert. |
| Analytics | Google Analytics integration | 🔄 | `initAnalytics` + `trackPageView` enabled. **Action:** set `REACT_APP_GA_MEASUREMENT_ID` in Pages build + Render env before launch. |
| Analytics | Web Vitals hook | ✅ | Default CRA `reportWebVitals` ready for custom logging (currently console). |
| SEO | Meta tags + JSON-LD | ✅ | Canonical/OG/Twitter tags set per route via `applySEO`. Site/Events/Forums structured data injected. |
| SEO | robots.txt & sitemap.xml | ✅ | Robots allow crawl; [`public/sitemap.xml`](../frontend/public/sitemap.xml) deployed to Pages. Submit to Google Search Console post-launch. |
| Monitoring | Security & rate-limit logging | ✅ | Winston security channel enabled; Render logs bookmarked. |
| Monitoring | Uptime checks | ⚪ | Optional: configure [UptimeRobot monitor](https://uptimerobot.com/) for `/healthz`. |
| Communications | Launch press/ad copy | ✅ | Short-form release prepared (see below). |
| Communications | Social/announcement checklist | ✅ | Sequence ready for Discord, Slack, email, and GitHub Discussions. |
| Communications | Media kit & assets | ✅ | Logos + screenshots stored in [`designs/`](designs/) and ready for press outreach. |

## Reference Links

- **GitHub repository:** https://github.com/BradleyMatera/car-match
- **Release 0.2.0:** https://github.com/BradleyMatera/car-match/releases/tag/0.2.0
- **Frontend (GitHub Pages):** https://bradleymatera.github.io/car-match/
- **Backend (Render dashboard):** https://dashboard.render.com/web/srv-carmatch
- **API health check:** https://car-match-h2gw.onrender.com/healthz
- **Launch checklist PDF:** [`docs/launch-checklist.pdf`](launch-checklist.pdf)
- **Ownership rollout doc:** [`docs/ownership-rollout.md`](ownership-rollout.md)
- **Beta issue tracker:** [`docs/beta-issue-tracker.md`](beta-issue-tracker.md)

## Pre-Launch QA Sign-off

- [ ] Login with a fresh account, then create → edit → delete an event (confirm success toasts + drawer update).
- [ ] RSVP/un-RSVP to a seeded event as a secondary user (verify counts, badges, and flash messages).
- [ ] Load Forums home, open a thread, and exercise moderator actions as an elevated user (pin/lock/delete).
- [ ] Validate SEO tags by running `npx --yes @stefanprobst/inspect-meta https://bradleymatera.github.io/car-match/`.
- [ ] Confirm GitHub Pages cache invalidated (hard refresh in incognito) after final deploy.
- [ ] Confirm Render runtime uses the latest commit (deploy logs timestamped within the hour).
- [ ] Ensure `REACT_APP_GA_MEASUREMENT_ID` env var is set in both Pages build (GitHub secrets) and Render.

## Communications & Schedule

| Time | Channel | Owner | Notes |
| --- | --- | --- | --- |
| T-24h | Project board + Slack heads-up | Bradley | Share final readiness + testing instructions. |
| T-1h | Discord/Twitter teaser | Bradley | "Launching at HH:00 — RSVP to the kickoff drive." |
| Launch (HH:00) | Publish announcement (GitHub Discussions, Slack, email) | Bradley | Use template below; attach screenshots and release link. |
| T+1h | Social follow-up | Bradley | Share RSVP screenshots + encourage forum introductions. |
| T+24h | Retrospective note | Bradley | Summarize analytics + gather feedback. |

## Post-Launch Monitoring Plan

1. **Analytics:** Open GA4 real-time dashboard to validate pageviews and conversions.  
2. **Logs:** Tail Render logs for `securityEvent` and error-level entries; capture anomalies in beta tracker.  
3. **Uptime:** (Optional) Configure an UptimeRobot monitor hitting `/healthz` every 5 minutes.  
4. **Support:** Check Slack/Discord #launch-support channel hourly for user feedback during the first 24h.  
5. **Metrics review:** At T+24h export GA engagement metrics + Render traffic stats into the project board issue.

## Rollback Plan

1. Pause new announcements; post a maintenance message on Slack/Discord.  
2. Revert Pages to tag [`v0.1.0`](https://github.com/BradleyMatera/car-match/releases/tag/0.1.0) via `npm run deploy -- --tag=0.1.0`.  
3. Redeploy Render using prior build (snapshot available in Render dashboard > Deploys tab).  
4. Update beta issue tracker with root cause + timeline, then resume comms when stable.  
5. Send apology/incident summary to testers if downtime exceeded 30 minutes.

## Support Contacts

| Role | Name | Contact | Notes |
| --- | --- | --- | --- |
| Product / Engineering | Bradley Matera | bradleymatera@gmail.com | Pager for launch window (24h). |
| Infrastructure | Render Support | https://render.com/support | Use if platform incidents occur. |
| Analytics | GA Admin (self) | GA Property > Admin > Data Streams | Ensure measurement ID is active. |

## Press & Asset Pack

- **Press release:** See [Communication Template](#launch-communication-template).  
- **Screenshots:** `designs/screenshots/` folder (hero, events, forums).  
- **Logo pack:** `designs/logos/CarMatch-logo-kit.zip`.  
- **Launch checklist PDF:** [`docs/launch-checklist.pdf`](launch-checklist.pdf) for distribution to stakeholders.

## Launch Communication Template

> **Subject:** CarMatch 0.2.0 is live — Organize your next drive today!
>
> CarMatch now supports full event ownership, real-time RSVP feedback, and upgraded moderation tools. Create your own meet, manage attendees, and join the conversation in our refreshed forums. Visit https://bradleymatera.github.io/car-match/ to explore the latest build and let us know what you think.
>
> **Highlights:**
> - Organizer dashboard: create, edit, and retire events with instant feedback
> - Forum enhancements: moderator tooling, empty-state messaging, and polished navigation
> - Analytics & SEO ready for launch day reporting
>
> Thanks for being part of the beta — see you at the next meet!

## Launch Day Run Book

1. **T-2 hours** – Final smoke test (new account, create/edit/delete event, RSVP as secondary user, forum navigation, profile edit).  
2. **T-1 hour** – Announce maintenance window (if needed) on project board / social channels.  
3. **Launch** – Publish announcement (GitHub Discussions, email, social), flip any feature flags, and monitor Render logs for errors.  
4. **T+1 hour** – Review analytics dashboard for first page views, confirm GA tracking.  
5. **T+24 hours** – Gather feedback from testers, triage any high-priority regressions, and update the beta tracker.

All supporting documentation has been refreshed (see `docs/ownership-rollout.md`, `docs/beta-issue-tracker.md`, and `docs/log2.md`). EOF
