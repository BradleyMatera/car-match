# Car Match Analytics Implementation
Owner: Data & Growth Team
Last Updated: 2025-09-29

Purpose: Provide a clear measurement framework, instrumentation checklist, and reporting cadence to operationalize analytics across Car Match.

## Measurement Framework
| Goal | Metric | Definition | Source | Frequency | Owner |
| ---- | ------ | ---------- | ------ | --------- | ----- |
| Grow community adoption | New member sign-ups | Number of accounts created per day/week | GA4 event (`sign_up`), Plausible | Daily | Growth PM |
| Drive engagement | Active members | Users with ≥1 session+action in last 7 days | GA4 audiences, product DB | Weekly | Product Analytics |
| Stimulate community content | Forum/thread creation | Count of new threads & replies | GA4 custom event (`forum_post`), DB | Weekly | Community Manager |
| Expand event participation | Event RSVPs | RSVP submissions | GA4 event (`event_rsvp`), Airtable | Weekly | Events Lead |
| Improve retention | DAU/MAU ratio | Daily active over monthly active | GA4 retention report | Weekly | Product Analytics |
| Campaign effectiveness | Channel conversions | Sign-ups attributed to campaign | GA4 + UTMs, Mailchimp | Per campaign | Channel Owners |

## GA4 Setup Checklist
- [ ] Install GA4 gtag or GTM container on all public-facing pages.
- [ ] Configure recommended events: `page_view`, `sign_up`, `login`, `forum_post`, `message_send`, `event_rsvp`.
- [ ] Define conversion events for `sign_up` and `event_rsvp`.
- [ ] Enable enhanced measurement (scrolls, outbound clicks) and remove irrelevant auto events.
- [ ] Set up internal traffic filter for team IPs/devices.
- [ ] Create audiences: New Members (≤7 days), Returning Builders (≥3 sessions), Event Seekers (visited `/events` twice).
- [ ] Integrate Search Console to GA4 for queries & landing page visibility.
- [ ] Configure GA4 Explorations for funnel (landing -> join -> sign-up) and path analysis (content to forum posts).

## Secondary Analytics Stack
- **Plausible**: Privacy-friendly dashboard for top-line sessions, referrers, and goals. Use UTM tagging to reconcile with GA4; embed live dashboard in team hub.
- **PostHog or Mixpanel (stretch)**: Evaluate for deeper product analytics if messaging/conversion experiments increase.
- **Hotjar/Microsoft Clarity**: Deploy limited heatmaps/session recordings during launch weeks to diagnose drop-offs (honor privacy policy).

## Reporting Cadence & Deliverables
| Report | Audience | Frequency | Owner | Distribution |
| ------ | -------- | --------- | ----- | ------------ |
| Weekly Growth Snapshot | Marketing + Product | Monday | Growth PM | Slack #growth + Notion page |
| Channel Scorecards | Channel owners | Friday | Channel Leads | Shared dashboard link |
| Executive Summary | Leadership/Instructor | Bi-weekly | Product Lead | PDF export + email |
| Experiment Results | Growth team | Upon completion | Experiment Owner | Experiment tracker + Slack thread |

## Data Quality Guardrails
- Run GA4 DebugView with every release to validate event firing.
- Track versioning of analytics implementation in repo/Notion (include GTM container IDs).
- Create anomaly alerts (GA4 custom insights) for sudden drops/spikes in traffic or conversions.
- Maintain backup export of key metrics monthly (CSV in secure drive).
- Document any manual data adjustments in changelog.

## Insight-to-Action Loop
1. Review dashboards Monday morning; flag anomalies or opportunities.
2. Record insights + recommended actions in weekly status report.
3. Assign owners to tests/improvements; log in experiment backlog.
4. Report back on impact the following week; archive learnings.
