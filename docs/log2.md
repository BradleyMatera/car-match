# Log ...🚀 

# Project & Portfolio  
### Bradley Matera  

![Degree Program](https://img.shields.io/badge/degree-web%20development-blue.svg)&nbsp;  

<br>

## 📢 &nbsp; Weekly Stand Up (September)

Each week I summarize milestone activity and progress. These stand-ups stay concise and follow the same prompts:

⚙️ Overview — What I worked on  
🌵 Challenges — Problems I hit & how I’m addressing them  
🏆 Accomplishments — What I leveled up on  
🔮 Next Steps — What I’ll prioritize next
_______

### Week 1

⚙️ Overview:  
Frontend is stable and live on GitHub Pages with forums UI, a standalone messages page, and auth/events all working against the backend. I tightened backend security with CORS and JWT rotation, and added forums endpoints with Mongoose models (working locally).

🌵 Challenges:  
Forums in production showed “Database not available” — root cause is a malformed/incorrectly encoded MongoDB URI on Render.

🏆 Accomplishments:  
Pages deploy is running; Render blueprint set up with health checks; refreshed repo docs across frontend, backend, and deployment guides.

🔮 Next Steps:  
Fix the MongoDB connection string on Render, redeploy, and confirm `/healthz` shows `connected: true` with forum threads/posts persisting in production.

### Week 2

⚙️ Overview:  
Combine and ship Settings as real features integrated into the Profile page (remove separate header tab). Clean up Profile UI/UX; “My Events” should only show events I created or RSVP’d to.

🌵 Challenges:  
Profile has some basic UI/UX issues and the current “My Events” view lists more than it should. Moderation + admin tiers are still needed for forums; events should be tied consistently to users.

🏆 Accomplishments (so far):  
Locked Pages deploy to main-only and redeployed; cleaned up repo branches and stray files via PRs; aligned Issues, Milestones (Sept Wk 2/3/4), and updated the Project board so statuses are accurate. Docs refresh started.

🔮 Next Steps:  
Finish Settings→Profile integration; validate MongoDB persistence in prod; begin moderation roles + event ownership work; continue docs polish and add change orders as needed.

### Week 3

⚙️ Overview:  
This week was focused on security hardening and deployment. Implemented ESLint security plugin, resolved all high-severity vulnerabilities, updated dependencies, and documented remaining moderate dev-only vulnerabilities. Enabled security scanning in CI/CD, hardened frontend and backend security (CSP, headers, input validation), and deployed the production build to GitHub Pages with all security features enabled. Documented security status in `SECURITY-NOTES.md`.

🌵 Challenges:  
Some vulnerabilities in dev dependencies (webpack-dev-server) could not be fully resolved due to upstream limitations in react-scripts. These do not affect production, but are documented for future tracking.

🏆 Accomplishments:  
- ESLint security plugin active and working
- All high-severity vulnerabilities fixed
- Security scanning and CI/CD integration complete
- Hardened input validation and security headers
- Production deployment to GitHub Pages with all security features enabled
- Security documentation added

🔮 Next Steps:  
Monitor for upstream fixes to dev dependencies, continue to polish security, and maintain documentation.

### Week 4

⚙️ Overview:  
Replaced every remaining mock/in-memory flow with real persistence. The Express API now talks directly to MongoDB for registration, profile edits, messaging, events, RSVPs, and comments. On the frontend, the old `mockApi` shim was retired in favor of a `client.js` REST wrapper, and React contexts/components now hydrate from live data. Documentation and weekly logs were updated to reflect the production architecture.

🌵 Challenges:  
- Removing the fallback arrays exposed a lot of legacy assumptions (e.g., event IDs, cached RSVPs), which required new normalizers and helper endpoints.  
- LocalStorage ran out of space storing full user payloads; added a persistence guard that falls back to a minimal profile snapshot.  
- Needed to keep CI happy (still under React Scripts) while making large refactors, so builds were re-run frequently to ensure no regression slipped in.

🏆 Accomplishments:  
- Backend: introduced `sanitizeUser`/`normalizeEvent` helpers, rewrote `/register`, `/login`, `/users/*`, `/messages`, `/events` routes to be database-only, and added `GET /users/me/events` for dashboard data.  
- Frontend: renamed `mockApi`→`client.js`, rewired Events/Profile/Messages/Forums to the live API, refreshed AuthContext hydration to consume `/users/me`, and ensured event creation/edit/delete hits the real backend.  
- Docs: updated repo file overview, component READMEs, and Week 4 log entry to explain the new architecture; ran `npm run build` to confirm production readiness.  
- GitHub: pushed everything to `main` with green builds; Dependabot warnings remain documented (1 high, 3 moderate dev-only).

🔮 Next Steps:  
- Verify production (Render + GitHub Pages) reflects the new persistence layer and update issues/project board accordingly.  
- Monitor the outstanding dev dependency advisories and react-scripts roadmap.  
- Continue polishing UX (e.g., messaging filters and profile garage management) now that the data is real.
_______
