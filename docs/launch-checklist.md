# Launch Checklist — CarMatch 0.2.0

This checklist captures the launch readiness items for the CarMatch beta-to-production rollout. Status values: ✅ complete, 🔄 in progress, ⚪ pending / not required.

| Area | Item | Status | Notes |
| --- | --- | --- | --- |
| Content | All core pages reviewed (Discover, Events, Forums, Profile, Login, Sign Up) | ✅ | Copy reviewed after ownership fixes; profile placeholders show “Coming soon” plan. |
| Content | Launch announcement draft | ✅ | Ready to post alongside press blurb (see Communications section). |
| Functionality | User registration & login | ✅ | Supports session persistence, validation, and relaxed auth rate-limits (50 attempts/5 min). |
| Functionality | Event creation | ✅ | Modal autofocus, success toast, newly created events injected + drawer auto-opens. |
| Functionality | Event edit/delete | ✅ | Organizer-only controls update both Mongo + cache with success toasts. |
| Functionality | RSVP toggle | ✅ | “Processing…” state, badge toggle, attendee count refresh, non-owner lockouts verified. |
| Functionality | Forums | 🔄 | Categories/threads load; moderator tooling works. “New Thread” submit button scheduled for next patch. |
| Functionality | Profile dashboard | ✅ | Profile header, About, Garage/Events tabs render; edit/save flows deliver confirmation toast. |
| Functionality | Messaging/Garage placeholders | 🔄 | Pages load with “Coming soon” messaging to set expectations. |
| Deployment | GitHub Pages (frontend) | ✅ | `npm run deploy` latest build (SEO + analytics) pushed. |
| Deployment | Render (backend) | ✅ | 0.2.0 backend live; `/healthz` returns connected. Manual redeploy instructions in DEPLOYMENT.md. |
| Analytics | Google Analytics integration | ✅ | `initAnalytics` + `trackPageView` (requires `REACT_APP_GA_MEASUREMENT_ID`). |
| Analytics | Web Vitals hook | ✅ | Default CRA `reportWebVitals` ready for custom logging. |
| SEO | Helmet-less hook `useSEO` + canonical/meta tags | ✅ | Titles/descriptions per route, OG/Twitter tags, JSON-LD for site/events/forums. |
| SEO | robots.txt & sitemap.xml | ✅ | Robots allow crawl; sitemap published with primary routes. |
| Monitoring | Security/rate limit logging | ✅ | 429 messaging documented; thresholds relaxed for launch. |
| Communications | Launch press/ad copy | ✅ | Short-form release prepared (see below). |
| Communications | Social/announcement checklist | ✅ | Outline ready for Discord, Slack, email, and project board posts. |

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
