# Security Notes

## Remaining Vulnerabilities

As of 2025-09-17, the following moderate vulnerabilities remain in the project:

- **webpack-dev-server**: Moderate severity, affects only development environment. No impact on production builds. Awaiting upstream fix in react-scripts.

## Status

- All production dependencies are secure.
- All high-severity vulnerabilities have been resolved.
- Security scanning and ESLint security plugin are active.
- Local development now mirrors production transport security via optional HTTPS (issue #101).
- API rate limiting active across auth, messaging, forums, and events endpoints (issue #103).
- Monitor for updates to react-scripts to fully resolve dev dependency issues.
