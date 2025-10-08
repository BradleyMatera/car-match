# React Context

Shared application state exposed via React Context providers.

```mermaid
graph TD
  Context[context/] --> Auth[AuthContext.js]
  Auth --> Consumers[Components using useAuth()]
```

- `AuthContext.js` — wraps the app with authentication state, exposing login, logout, and user/session helpers.
