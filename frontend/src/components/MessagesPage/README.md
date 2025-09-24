# Messages Page

Full messaging dashboard with tabbed inbox views, premium filters, and composer.

```mermaid
graph TD
  MessagesPage[MessagesPage/] --> Index[index.js]
  MessagesPage --> Styles[messages.css]
  Index --> ApiClient[../../api/client.js]
  Index --> AuthCtx[../../context/AuthContext]
```

- `index.js` — manages tab state, premium-only filters, message fetching, and send workflow.
- `messages.css` — inbox layout, tabs, filters, and compose form styling.
