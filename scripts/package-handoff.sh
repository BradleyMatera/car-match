#!/usr/bin/env bash

# Package the repository (minus Git metadata and build artefacts) for handoff submission.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/package-handoff.sh [--format tar.gz|zip]

Creates an archive of the current repository without the .git directory or the dist/ output folder.
Defaults to tar.gz. Archives are written to dist/.
EOF
}

format="tar.gz"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --format)
      format="${2:-}"
      if [[ -z "$format" ]]; then
        echo "Error: --format requires an argument" >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d .git ]]; then
  echo "Error: run this script from the repository root." >&2
  exit 1
fi

timestamp="$(date +"%Y%m%d-%H%M%S")"
branch="$(git rev-parse --abbrev-ref HEAD)"
# Replace slashes in branch names so archive paths remain valid.
branch="${branch//\//-}"
dist_dir="dist"
mkdir -p "$dist_dir"

archive_base="car-match-${branch}-${timestamp}"

case "$format" in
  tar.gz)
    archive_path="${dist_dir}/${archive_base}.tar.gz"
    tar \
      --exclude=".git" \
      --exclude="${dist_dir}" \
      --exclude="node_modules" \
      -czf "$archive_path" .
    ;;
  zip)
    archive_path="${dist_dir}/${archive_base}.zip"
    zip \
      -rq "$archive_path" \
      . \
      -x ".git/*" "${dist_dir}/*" "node_modules/*"
    ;;
  *)
    echo "Unsupported format: $format (use tar.gz or zip)" >&2
    exit 1
    ;;
esac

echo "Created ${archive_path}"
