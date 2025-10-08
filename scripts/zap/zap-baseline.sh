#!/usr/bin/env bash
set -euo pipefail

# Purpose: Run the OWASP ZAP baseline scan in Docker against a provided URL.
# Usage:   ./scripts/zap/zap-baseline.sh <target-url>
# Env:     ZAP_IMAGE (override image), ZAP_CONTEXT_FILE (bind-mount context),
#          ZAP_CONFIG_ARGS (extra args passed to zap-baseline.py)
# Requires: Docker installed locally with permission to run containers.

TARGET_URL="${1:-}"
if [[ -z "$TARGET_URL" ]]; then
  echo "Usage: $0 <target-url>" >&2
  exit 1
fi

OUTPUT_DIR="zap-reports"
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
REPORT_BASENAME="zap-baseline-${TIMESTAMP}"

# Allow override of ZAP Docker image
ZAP_IMAGE=${ZAP_IMAGE:-"owasp/zap2docker-stable"}

# Authentication / routes to include/exclude can be configured via additional env vars
ZAP_CONTEXT_FILE=${ZAP_CONTEXT_FILE:-}
ZAP_CONFIG_ARGS=${ZAP_CONFIG_ARGS:-}

DOCKER_ARGS=(
  run --rm
  -v "$(pwd)/$OUTPUT_DIR:/zap/wrk"
)
if [[ -n "$ZAP_CONTEXT_FILE" ]]; then
  DOCKER_ARGS+=( -v "$ZAP_CONTEXT_FILE:/zap/context/context.context:ro" )
  ZAP_CONFIG_ARGS+=" -r context.context"
fi

COMMAND=( "$ZAP_IMAGE" zap-baseline.py -t "$TARGET_URL" \
  -r "$REPORT_BASENAME.html" \
  -J "$REPORT_BASENAME.json" \
  -x "$REPORT_BASENAME.xml" \
  ${ZAP_CONFIG_ARGS:-} )

set -x
docker "${DOCKER_ARGS[@]}" "${COMMAND[@]}"
set +x

echo "Reports generated under $OUTPUT_DIR/$REPORT_BASENAME.{html,json,xml}" 
