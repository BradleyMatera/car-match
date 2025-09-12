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

### Week 2 (in progress — Friday)

⚙️ Overview:  
Combine and ship Settings as real features integrated into the Profile page (remove separate header tab). Clean up Profile UI/UX; “My Events” should only show events I created or RSVP’d to.

🌵 Challenges:  
Profile has some basic UI/UX issues and the current “My Events” view lists more than it should. Moderation + admin tiers are still needed for forums; events should be tied consistently to users.

🏆 Accomplishments (so far):  
Locked Pages deploy to main-only and redeployed; cleaned up repo branches and stray files via PRs; aligned Issues, Milestones (Sept Wk 2/3/4), and updated the Project board so statuses are accurate. Docs refresh started.

🔮 Next Steps:  
Finish Settings→Profile integration; validate MongoDB persistence in prod; begin moderation roles + event ownership work; continue docs polish and add change orders as needed.

### Week 3 (planned)

⚙️ Overview:  
Introduce moderator/admin roles and enforce permissions for pin/lock/delete; complete event ownership linkage; polish Profile flows.

🔮 Next Steps:  
Ship moderation MVP; add minimal UI affordances; expand tests and tighten endpoints.

### Week 4 (planned)

⚙️ Overview:  
Stabilization and demo readiness: performance touch-ups, error handling, and final docs pass.

🔮 Next Steps:  
Finalize release notes; backlog triage; prepare next-month roadmap.

<br>
