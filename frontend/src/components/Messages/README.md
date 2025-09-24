# Messages Widget

Legacy messaging UI (not wired into routing) used for concept demos.

```mermaid
graph TD
  MessagesDir[Messages/] --> Index[index.js]
  MessagesDir --> Styles[Messages.css]
  Index --> MockApi[../../api/mockApi.js]
```

- `index.js` — placeholder component showing conversation display and composer wiring.
- `Messages.css` — message bubble layout and form styling.
