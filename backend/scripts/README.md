# Backend Scripts

One-off Node utilities used to maintain database state.

```mermaid
graph TD
  Scripts[backend/scripts/] --> Seed[seedFromMock.js]
  Seed --> Mock[../seed/mockData-loader.js]
```

- `seedFromMock.js` — pulls the historical `mockApi.js` arrays from git, hashes demo passwords, and upserts users/events/messages/forums into MongoDB. Requires `MONGODB_URI` and optional `MOCK_REV`.
