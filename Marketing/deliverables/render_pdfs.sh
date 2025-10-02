#!/usr/bin/env bash
# Render marketing Markdown deliverables to PDF using md-to-pdf.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

render() {
  local src="$1"
  local path="${ROOT_DIR}/${src}"
  if [ ! -f "$path" ]; then
    echo "[skip] $src not found" >&2
    return
  fi
  echo "[render] $src"
  npx -y md-to-pdf "$path"
}

render "CarMatch_Marketing_SEO_Analytics_Plan.md"
render "CarMatch_Marketing_SEO_Analytics_Summary.md"
render "CarMatch_Marketing_SEO_Analytics_Response.md"
