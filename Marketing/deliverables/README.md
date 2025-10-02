# Submission-Ready Deliverables
Last Updated: 2025-09-29

Use these files when preparing updates for instructors, stakeholders, or peers.

| File | Format | Purpose |
| ---- | ------ | ------- |
| `CarMatch_Marketing_SEO_Analytics_Summary.md` | Markdown | One-page overview with links to every supporting artifact |
| `CarMatch_Marketing_SEO_Analytics_Summary.pdf` | PDF | Export-ready version of the overview for submissions |
| `CarMatch_Marketing_SEO_Analytics_Plan.md` | Markdown | Full narrative plan combining marketing, SEO, analytics, status update |
| `CarMatch_Marketing_SEO_Analytics_Plan.pdf` | PDF | Exported version of the full plan for direct submission |
| `CarMatch_Marketing_SEO_Analytics_Response.md` | Markdown | Q&A style responses to assignment prompts |

### PDF Exports
Render fresh PDFs after significant edits. Two options:

1. Run the helper script (recommended):
   ```bash
   cd Marketing/deliverables
   ./render_pdfs.sh
   ```
2. Or call `md-to-pdf` manually for a single file:
   ```bash
   npx -y md-to-pdf Marketing/deliverables/CarMatch_Marketing_SEO_Analytics_Plan.md
   ```

The script uses `npx md-to-pdf` under the hood and regenerates the plan, summary, and response PDFs in one pass. Track revisions by updating file headers with the new dates and keeping commits small and descriptive.
