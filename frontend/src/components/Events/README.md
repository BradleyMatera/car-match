# Events Feature

Events landing page with carousel, calendar, RSVP handling, and forum previews.

```mermaid
flowchart TD
  EventsDir[Events/] --> Index[index.js]
  EventsDir --> Styles[Events.css]
  Index --> MockApi[../../api/mockApi.js]
  Index --> SectionComp[../Section]
  Index --> AuthCtx[../../context/AuthContext]
```

- `index.js` — orchestrates event fetching, RSVP mutations, event creation modal logic, and background rotation.
- `Events.css` — presentation for the events page, hero, cards, and modal.
