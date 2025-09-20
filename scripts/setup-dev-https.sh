#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/certs/dev"
KEY_FILE="$OUT_DIR/server.key"
CERT_FILE="$OUT_DIR/server.crt"
FORCE="${1:-}"

if ! command -v openssl >/dev/null 2>&1; then
  echo "Error: openssl is required but not installed." >&2
  exit 1
fi

if [[ -f "$KEY_FILE" || -f "$CERT_FILE" ]]; then
  if [[ "$FORCE" != "--force" ]]; then
    echo "Certificates already exist at $OUT_DIR." >&2
    echo "Rerun with --force to overwrite." >&2
    exit 1
  fi
  rm -f "$KEY_FILE" "$CERT_FILE"
fi

mkdir -p "$OUT_DIR"
TMP_CONF="$(mktemp)"
trap 'rm -f "$TMP_CONF"' EXIT

cat >"$TMP_CONF" <<'CONF'
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = US
ST = Local
L = Local
O = Car Match
OU = Dev
CN = localhost

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
CONF

openssl req -x509 -nodes -days 825 \
  -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -config "$TMP_CONF" \
  -extensions req_ext

chmod 600 "$KEY_FILE"

cat <<INFO
Generated development certificate:
  Key:  $KEY_FILE
  Cert: $CERT_FILE

Frontend env (create frontend/.env.development.local):
  HTTPS=true
  SSL_CRT_FILE=$CERT_FILE
  SSL_KEY_FILE=$KEY_FILE

Backend env (development):
  DEV_HTTPS=true
  DEV_HTTPS_CERT=$CERT_FILE
  DEV_HTTPS_KEY=$KEY_FILE
  DEV_HTTPS_PORT=3443   # optional override

To trust the certificate system-wide, add it to your local keychain/certificate store.
INFO
