# Home Page

Landing experience featuring community stats, forum teasers, featured events, and brand messaging.

```mermaid
flowchart TD
  HomeDir[Home/] --> Index[index.js]
  HomeDir --> Styles[Home.css]
  Index --> Section[../Section]
  Index --> Grid[../Grid]
  Index --> MockApi[../../api/mockApi.js]
```

- `index.js` — loads stats, latest threads, and upcoming events to populate the hero and feature sections.
- `Home.css` — page backgrounds, cards, and typography for the landing experience.
