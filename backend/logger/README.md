# Logger

Centralised Winston logger configuration with JSON + rotating file transports.

```mermaid
graph TD
  Logger[logger/] --> Index[index.js]
  Index --> AppLogs[app-%DATE%.log]
  Index --> SecurityLogs[security-%DATE%.log]
```

- `index.js` — configures logger levels, daily rotation, console formatting, and exposes the `logger` + `securityEvent` helpers.
- `logs/` — runtime output directory created automatically (gitignored).
