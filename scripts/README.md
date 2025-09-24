# Scripts Directory

Utility scripts that support local development, automation, and security scans.

## setup-dev-https.sh
Generates a reusable localhost TLS certificate and key for the frontend dev
server and Express API. Run `bash scripts/setup-dev-https.sh` to create
`certs/dev/server.{crt,key}`. Pass `--force` to overwrite existing files.

## update_roadmap.sh
Pushes GitHub Project (Project V2) roadmap dates/status for curated issues using
`gh` and `jq`. Configure via environment variables before running:
`GH_OWNER=<user> REPO=<repo> PROJECT_NUMBER=<n> bash scripts/update_roadmap.sh`.

## zap/zap-baseline.sh
Wrapper around the OWASP ZAP Docker image to execute the baseline scan and
collect HTML/JSON/XML reports under `zap-reports/`. Invoke with
`./scripts/zap/zap-baseline.sh https://target.example.com`. Optional variables:
`ZAP_IMAGE`, `ZAP_CONTEXT_FILE`, `ZAP_CONFIG_ARGS`.

The `zap/` subdirectory contains tooling specific to the security testing flow.
