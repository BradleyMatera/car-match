# Seed Helpers

Support files for database seeding flows.

```mermaid
graph TD
  Seed[seed/] --> Loader[mockData-loader.js]
  Loader --> Extract[extractFromSource()]
```

- `mockData-loader.js` — evaluates the legacy frontend `mockApi.js` file inside a VM context and extracts the mock arrays for use during seeding.
