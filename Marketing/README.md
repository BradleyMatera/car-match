# Car Match Marketing Workspace
Last Updated: 2025-09-29

Welcome to the central hub for all marketing, SEO, analytics, and status documentation supporting Car Match. Start here to understand the folder layout, available playbooks, and how to export deliverables.

## Quick Start
1. **Need the concise overview?** Read `deliverables/CarMatch_Marketing_SEO_Analytics_Summary.md` for a one-page brief with links to every artifact.
2. **Looking for deep guidance?** Jump into `core/SEO&MARKETING.MD` and the playbooks in `playbooks/`.
3. **Submitting deliverables?** Use the PDF-ready files in `deliverables/` and follow the export instructions below.

## Directory Map
| Path | Purpose | Key Files |
| ---- | ------- | --------- |
| `core/` | Canonical marketing narrative and historical guide | `SEO&MARKETING.MD` |
| `playbooks/` | Execution toolkits by discipline (channels, analytics, growth, reporting) | Channel, Roadmap, SEO Keyword, Analytics, Status, Growth playbooks |
| `deliverables/` | Assignment-ready outputs and summaries | Plan, Response, Summary (MD + PDF) |

## Document Flow
1. **Strategy** lives in `core/SEO&MARKETING.MD`.
2. **Execution** details (roadmaps, channel cadences, analytics/config) sit under `playbooks/`.
3. **Submission packages** are composed from the playbooks and stored under `deliverables/`.

## Exporting PDFs
Run the following from repository root to render Markdown deliverables:

```bash
npx -y md-to-pdf Marketing/deliverables/CarMatch_Marketing_SEO_Analytics_Plan.md
npx -y md-to-pdf Marketing/deliverables/CarMatch_Marketing_SEO_Analytics_Summary.md
```

## Maintenance Checklist
- Update dates in headers when substantial edits are made.
- Reflect new experiments or loops in both the Growth Playbook and Go-To-Market roadmap.
- Log weekly progress using the Status Report Template and archive in deliverables as needed.
