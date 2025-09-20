# Local HTTPS Certificates

Generated development certificates live in this directory.

Certificates are ignored by Git. Run `scripts/setup-dev-https.sh` to create a self-signed certificate/key pair for local HTTPS development.

```
./scripts/setup-dev-https.sh
```

The script will place artifacts under `certs/dev/` and print the environment variables required by the frontend (`HTTPS`, `SSL_CRT_FILE`, `SSL_KEY_FILE`) and backend (`DEV_HTTPS`, `DEV_HTTPS_CERT`, `DEV_HTTPS_KEY`).

Never commit generated certificates.
