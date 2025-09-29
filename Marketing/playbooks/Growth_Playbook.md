# Car Match Growth Playbook
Owner: Growth PM
Last Updated: 2025-09-29

Purpose: Connect the marketing roadmap and channel plans into actionable growth loops, prioritised experiments, and operating rituals.

## Growth Thesis
- Combine authentic community content with event-driven spikes to create a sustainable acquisition and retention flywheel.
- Use data-informed iteration: every campaign or feature ships with a hypothesis, success metric, and follow-up action logged in the experiment tracker.
- Empower champions (club leads, content creators) as distribution multipliers through referral perks and co-created content.

## Core Growth Loops
| Loop | Trigger | Action | Output Metric | Owner |
| ---- | ------- | ------ | ------------- | ----- |
| Content → Engagement → Shares | Publish member build or event recap | Promote across socials + email with CTA to share | Social shares, new sessions, comments | Content Lead |
| Events → RSVPs → New Members | List new meet/track event | RSVP workflow + QR on-site | RSVP count, sign-ups, retention | Events Lead |
| Referral → Onboarding → Advocacy | Member invites friend with badge incentive | Personalized invite email, guided onboarding | Referral sign-ups, DAU/MAU uplift | Community Manager |
| Partnerships → Co-Marketing → Traffic | Partner announcement with club/shop | Joint blog + social swap | Partner-driven sessions, codes redeemed | Partnerships Lead |

## Experiment Backlog (Snapshot)
| Hypothesis | Loop | Effort | Impact | Status | Notes |
| ---------- | ---- | ------ | ------ | ------ | ----- |
| Adding a "Share your build" prompt post-signup increases first-week forum posts by 20% | Referral/Onboarding | M | M | Ready | Requires UX copy + analytics event |
| Featuring city-specific event guides boosts organic sessions by 30% in target metros | Content/Event | H | H | Backlog | Align with SEO landing page roll-out |
| Partner welcome packets drive 15% more referral sign-ups | Partnerships | L | M | In progress | Drafted collateral; awaiting partner feedback |
| TikTok paid tests can hit <$4 CPA | Content/Paid | H | H | Idea | Dependent on creative budget approval |
| Automating weekly KPI digest via Looker Studio increases team velocity | Data Loop | M | M | Ready | Needs BigQuery connector + Slack webhook |

## Operating Cadence
- **Monday Growth Standup:** review KPIs, insights, loop health, and backlog updates.
- **Wednesday Experiment Clinic:** evaluate in-progress experiments, unblock owners, and adjust tracking.
- **Friday Retro:** capture learnings, decide scale/stop for experiments, and queue next tests.

## Tooling & Artifacts
- Experiment tracker tab in `CarMatch_GoToMarket_Roadmap.md` for status and owners.
- UTM & analytics conventions defined in `CarMatch_Analytics_Implementation.md`.
- Content calendar and asset links maintained from the Channel Playbook.
- Feedback capture (Notion database + Slack #feedback) feeding back into loop health.

## KPIs & Alerting
| Metric | Threshold | Alert Mechanism | Owner | Action |
| ------ | --------- | --------------- | ----- | ------ |
| Visit → Signup Conversion | <12% for 3 days | GA4 insight + Slack notification | Growth PM | Trigger UX review + test new onboarding prompt |
| Weekly Active Members | <35% DAU/MAU | Looker Studio conditional highlight | Community Manager | Launch re-engagement email + feature highlight |
| Organic Sessions | -20% WoW | Search Console report | SEO Specialist | Investigate ranking drops, update content |
| Referral Sign-ups | <5/week | Airtable automation email | Partnerships Lead | Push referral CTA & highlight perks |

## How to Engage
1. Review loop status and experiment backlog before creating new marketing asks.
2. Add proposals to backlog using hypothesis template (impact/effort scoring).
3. Ensure every greenlit experiment has defined measurement and owner.
4. Log learnings in weekly status update and archive in retro doc for institutional knowledge.
