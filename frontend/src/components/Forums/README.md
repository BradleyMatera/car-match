# Forums Feature

Forums hub for categories, threads, moderation, and post workflows.

```mermaid
flowchart TD
  ForumsDir[Forums/] --> Index[index.js]
  ForumsDir --> Styles[Forums.css]
  Index --> ApiClient[../../api/client.js]
  Index --> AuthCtx[../../context/AuthContext]
```

- `index.js` — loads categories/threads, handles search + pagination, moderation actions, and thread/post composition.
- `Forums.css` — styling for forum list, thread detail, and responsive layout.
