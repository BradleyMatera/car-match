# Car Match Asset Manifest
This manifest enumerates every deliverable included in the Car Match handoff package to ensure nothing is missed during grading or operational transfer.

## Repository Roots
| Path | Contents | Notes |
| ---- | -------- | ----- |
| `frontend/` | React single-page application (GH Pages deployment source) | Includes components, contexts, mock + API clients |
| `backend/` | Node/Express API with JWT auth, Mongo persistence, logging | Render blueprint (`render.yaml`) lives at repo root |
| `scripts/` | Automation helpers (`setup-dev-https.sh`, ZAP scan, new `package-handoff.sh`) | See `scripts/README.md` for usage |
| `certs/` | Dev TLS assets (generated) | Safe to regenerate via `scripts/setup-dev-https.sh` |
| `Marketing/` | Marketing, SEO, analytics plans (Markdown + PDF exports) | Added from `feature/marketing-playbooks` branch for final packet |
| `docs/` | Course docs: project proposal, logs, research, change orders, troubleshooting | `docs/FILE_OVERVIEW.md` provides deeper index |
| `handoff/` | Final handoff artifacts (this folder, maintenance, install, branch catalog) | Start with `handoff/README.md` |
| `backend.dev.log`, `frontend.dev.log` | Latest local run logs | Regenerate by rerunning services locally |

## Key Documentation
- **Project Plan:** `docs/ProjectProposal.md`
- **Change Orders & Beta Issues:** `docs/beta-issue-tracker.md`, `docs/moderation-roles-plan.md`, `docs/ownership-rollout.md`
- **Logs & Status Reports:** `docs/log.md`, `docs/log2.md`, `docs/2025-09.md`
- **Research Portfolio:** `docs/research/` (R1–R4 notes, SWOT, tooling reviews)
- **Launch Artifacts:** `docs/launch-checklist.md` (+ PDF), `docs/TROUBLESHOOTING.md`, `docs/SECURITY-NOTES.md`
- **Design Assets:** `docs/designs/` (high-fidelity screens, style references)

## Marketing & Growth Deliverables
- `Marketing/core/SEO&MARKETING.MD` — canonical marketing narrative
- `Marketing/playbooks/` — channel, growth, SEO keyword, analytics implementation, status templates
- `Marketing/deliverables/` — PDF-ready submissions (Plan, Response, Summary) plus `render_pdfs.sh`

## Logs & Operational Data
- Backend log retention configuration: `backend/logger/README.md`
- Sample dev logs (text) for troubleshooting: `backend.dev.log`, `frontend.dev.log`
- Status report template: `Marketing/playbooks/CarMatch_Status_Report_Template.md`

## Automation & Scripts
- `scripts/package-handoff.sh` — creates `.tar.gz` or `.zip` without Git metadata
- `scripts/setup-dev-https.sh` — generates local TLS certificates
- `scripts/zap/zap-baseline.sh` — wraps OWASP ZAP Docker scan
- `backend/scripts/seedFromMock.js` — seeds Mongo with mock data

## Branch References
See `handoff/BRANCH_CATALOG.md` for descriptions and recommended usage of every Git branch provided with this handoff.

> If additional assets are generated (new logs, analytics exports, etc.), append them to this manifest and commit alongside the update.

