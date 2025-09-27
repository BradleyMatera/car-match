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

Reminder:  Weekly Log Update  
As a follow-up to the team stand-up discussion, be sure to share your final progress at the end of each week by updating your weekly log file on GitHub. You will want to make sure your final log entry covers the following:

⚙️ Overview - What I worked on this past week  
🌵 Challenges - What problems did I have & how I'm addressing them  
🏆 Accomplishments - What is something I "leveled up" on this week  
🔮 Next Steps - What I plan to prioritize and do next

### Week 4

⚙️ Overview:  
Opened Milestone `359 MS 10`, kept the `dev → staging` rollup PR active, and broke the Events Ownership (#64) and Forums Moderation (#63) work into 20 child issues covering research, development, documentation, and directed feedback. Posted backend/front-end research findings (issues #111, #112), refreshed epic bodies, and synchronized the project board with Ready/In progress statuses.

🌵 Challenges:  
- Legacy events store mixed `createdByUserId` types, forcing the API/UI to treat organizers as “Unknown” until the schema is tightened.
- Events UI still relies on the legacy `mockApi`, so owner gating and thread linking behave inconsistently.

🏆 Accomplishments:  
- Updated milestone metadata and project board to reflect the current sprint.
- Added research summaries + rollout plans to the master log and epics without spawning new docs.
- Merged documentation PR #131 after verifying the workflow through feature branch → dev.

🔮 Next Steps:  
- Tackle implementation issues (#113–#118, #123–#128) to enforce ownership and moderation roles.
- Run backfill/seed updates once schema changes are in place.
- Continue grooming the project board as tasks move from Ready → In progress → Done.
_______
