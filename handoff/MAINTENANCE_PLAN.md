# Car Match Maintenance Plan
Last updated: Oct 2025 · Owner: Bradley Matera · Branch: `handoff/final-week4`

This plan equips the receiving team with the cadence, tooling, and escalation paths required to operate Car Match after handoff. Keep this document alongside the deployment guide (`handoff/INSTALLATION.md`) and repository overview (`handoff/ASSET_MANIFEST.md`).

## 1. Goals & Service Objectives
- **Uptime target:** ≥99.5 % monthly availability for both frontend (GitHub Pages) and backend (Render web service).
- **Performance guardrails:** Median API latency ≤400 ms, SPA first meaningful paint ≤2.5 s on broadband.
- **Security posture:** No known high-severity npm advisories; OWASP ZAP baseline scan clean before major releases.
- **Data retention:** Event/forum data backed by MongoDB Atlas with nightly snapshot; application logs retained 14 days.

## 2. Roles & Contacts
| Role | Primary | Backup | Escalation |
| ---- | ------- | ------ | ---------- |
| Product Owner / PM | Bradley Matera | TBD (Receiving PM) | Weekly status review |
| Tech Lead | Bradley Matera | Incoming dev lead | Slack/Teams within 2 hrs |
| DevOps / Hosting | Receiving ops engineer | Bradley Matera (handoff period) | Pager/phone per incident |
| Support & Moderation | Community Manager (see `docs/moderation-roles-plan.md`) | On-call moderator | Forums escalation channel |

Contact schedule and communication expectations are detailed in `docs/log2.md` (Week 3 log) and `docs/ownership-rollout.md`.

## 3. Environments & Branches
- **Development (`dev` branch):** Active feature work, local testing. Deploys to developer machines only.
- **Staging (`staging` branch):** Integration branch; optional Render preview. Use for QA sign-off.
- **Production (`main` branch):** Source of truth for GitHub Pages + Render. Only merge via reviewed PRs.
- **Specialty branches:** See `handoff/BRANCH_CATALOG.md` for documentation, marketing, or security experiments.

Maintain the Git workflow described in the root `README.md` and require at least one approving review before promoting to `main`.

## 4. Monitoring & Alerting
- **Render Dashboards:** Monitor CPU, memory, response time, deploy status. Enable email alerts for failure or degraded health checks.
- **Backend logs:** Winston rotates daily under `backend/logger/logs` (14-day retention). Forward logs to centralized storage (e.g., CloudWatch) if organisation requires longer retention.
- **Frontend:** GitHub Pages web analytics plus optional Simple Analytics snippets embedded in the SPA (see `frontend/src/utils/analytics.js`).
- **Synthetics & Smoke Tests:** Run `npm run test` (frontend) and `npm run lint` before each release. Optional: automate `./scripts/zap/zap-baseline.sh <prod-url>` monthly.
- **Status checks:** Ensure GitHub Actions (`deploy-frontend.yml`, `npm-audit.yml`) remain green pre-merge.

## 5. Maintenance Cadence
| Frequency | Tasks | Owners | References |
| --------- | ----- | ------ | ---------- |
| **Each deploy** | Run unit tests, review `npm audit`, execute smoke test (login, events, forums). Update `docs/2025-09.md` or successor log with release summary. | Tech Lead | `docs/log2.md`, `docs/beta-issue-tracker.md` |
| **Weekly** | Review support tickets/forums; triage in GitHub Project. Pull Render logs for anomalies. Confirm Mongo backups succeeded. | Support Lead, DevOps | `backend/logger/README.md` |
| **Monthly** | Run OWASP ZAP baseline, regenerate analytics reports via `Marketing/deliverables/render_pdfs.sh`, prune stale feature branches, review SEO keyword map. | Tech Lead, Marketing Lead | `Marketing/README.md` |
| **Quarterly** | Rotate `JWT_SECRET`, bump `TOKEN_VERSION`, audit user roles (`docs/moderation-roles-plan.md`), revisit rate-limit thresholds (`backend/middleware/rateLimits.js`). | DevOps, Product Owner | `docs/SECURITY-NOTES.md` |
| **Annually / Major upgrade** | Refresh frontend dependencies (`npm update`), review architecture against latest roadmap, regenerate certificates via `scripts/setup-dev-https.sh`. | Engineering | `docs/TechStack.md` |

## 6. Incident Response
1. **Detect:** Automated alert or manual report.
2. **Stabilise:** Toggle `MAINTENANCE_MODE` banner (frontend `src/components/Home`) if necessary, and scale Render service or rollback to last known good deploy.
3. **Communicate:** Post incident summary in community channels, escalate internally per contact table.
4. **Document:** Capture root cause + fix in `docs/log2.md` (or subsequent monthly log) and open follow-up issues on the Project board.
5. **Prevent:** Add regression test or monitoring, update Troubleshooting (`docs/TROUBLESHOOTING.md`) as needed.

For security incidents, rotate secrets immediately, revoke sessions by incrementing `TOKEN_VERSION`, and notify affected members within 72 hours.

## 7. Data Management
- **Database:** MongoDB Atlas recommended (M0 or higher). Configure continuous backups or nightly snapshots. Seed with sample data via `node scripts/seedFromMock.js` (see `handoff/INSTALLATION.md`).
- **Logs:** Default retention 14 days; adjust via `LOG_RETENTION_DAYS`. Export to S3/Blob for long-term storage if compliance mandates.
- **Static assets:** Design source files live under `docs/designs/` (Figma exports). Marketing PDFs stored in `Marketing/deliverables/`.
- **Backups checklist:** Track completion in the Growth/Status templates within `Marketing/playbooks/CarMatch_Status_Report_Template.md`.

## 8. Change Management
- Track scope using GitHub Projects (Kanban). Reference `docs/ProjectProposal.md` for baseline requirements.
- All change requests should update the `beta-issue-tracker.md` or a successor issue log.
- Maintain semantic versioning in release notes (`docs/2025-09.md` or future monthly logs).
- Archive major milestone artefacts (playbooks, research, analytics) using `scripts/package-handoff.sh` for institutional record keeping.

## 9. Dependencies & Tooling
- **Node:** 18.x (see `.nvmrc`).
- **Frontend build:** Create React App toolchain; `npm` scripts (start/test/build).
- **Backend stack:** Express 5, Mongoose, Winston, Helmet.
- **Security tooling:** `npm audit`, OWASP ZAP, ESLint security plugin, rate limiting.
- **CI/CD:** GitHub Actions (deploy, audit), Render auto-deploy.

See `docs/TechStack.md` for complete dependency matrix and lifecycle notes.

## 10. Appendix
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **Ownership & moderation:** `docs/ownership-rollout.md`, `docs/moderation-roles-plan.md`
- **Research archive:** `docs/research/`
- **Marketing playbooks:** `Marketing/`
- **Packaging script:** `scripts/package-handoff.sh`

Keep this maintenance plan updated as responsibilities shift. Update the header date and notify stakeholders whenever procedures change.

