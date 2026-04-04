#!/usr/bin/env bash
# ============================================================
# SCEMAS dev startup script
# Works on Linux, macOS, and Windows (Git Bash / WSL)
#
# Usage (run from the src/ directory):
#   ./start.sh            # normal start — rebuilds images
#   ./start.sh --no-build # fast restart — skips image rebuild
#   ./start.sh --regen    # force-regenerate TLS certs + rebuild
#   ./start.sh --help     # show this message
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_DIR="$SCRIPT_DIR/mosquitto/config/certs"
NO_BUILD=false
REGEN_CERTS=false

# ── Parse flags ───────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --no-build)  NO_BUILD=true ;;
    --regen)     REGEN_CERTS=true ;;
    --help|-h)
      echo "Usage: ./start.sh [--no-build] [--regen]"
      echo "  (no flags)  Build Docker images and start all services"
      echo "  --no-build  Skip image rebuild (faster restart)"
      echo "  --regen     Force-regenerate MQTT TLS certificates"
      exit 0 ;;
  esac
done

cd "$SCRIPT_DIR"

# ── Check Docker is available ─────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "❌ Docker not found. Install Docker Desktop and try again."
  exit 1
fi

# Detect 'docker compose' (v2 plugin) vs 'docker-compose' (v1 standalone)
if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
else
  echo "❌ Neither 'docker compose' nor 'docker-compose' found."
  exit 1
fi

# ── Step 1: TLS certificates ──────────────────────────────────
CERTS_PRESENT=false
if [[ -f "$CERT_DIR/ca.crt" && -f "$CERT_DIR/server.crt" ]]; then
  CERTS_PRESENT=true
fi

if [[ "$REGEN_CERTS" == true || "$CERTS_PRESENT" == false ]]; then
  echo ""
  echo "🔐 Generating MQTT TLS certificates via Docker..."
  mkdir -p "$CERT_DIR"

  # MSYS_NO_PATHCONV=1 stops Git Bash on Windows from mangling the -subj paths.
  # It is harmless on Linux and macOS (treated as an unknown env var).
  MSYS_NO_PATHCONV=1 docker run --rm \
    -v "$CERT_DIR:/certs" \
    alpine sh -c "
      apk add --no-cache openssl -q 2>/dev/null
      openssl req -new -x509 -days 365 \
        -keyout /certs/ca.key -out /certs/ca.crt \
        -subj '/C=CA/ST=Ontario/CN=MosquittoCA' -nodes
      openssl genrsa -out /certs/server.key 2048
      openssl req -new -key /certs/server.key -out /tmp/server.csr \
        -subj '/C=CA/ST=Ontario/CN=mosquitto'
      openssl x509 -req \
        -in /tmp/server.csr \
        -CA /certs/ca.crt -CAkey /certs/ca.key -CAcreateserial \
        -out /certs/server.crt -days 365
      rm -f /tmp/server.csr /certs/ca.srl
    "
  echo "✅ Certificates ready"
else
  echo "✅ TLS certificates already present — use --regen to force-regenerate"
fi

# ── Step 2: Tear down stale containers + anonymous volumes ─────
echo ""
echo "🧹 Removing stale containers and volumes..."
$DC down -v 2>/dev/null || true

# ── Step 3: Start the stack ────────────────────────────────────
echo ""
if [[ "$NO_BUILD" == true ]]; then
  echo "🚀 Starting containers (skipping rebuild)..."
  $DC up
else
  echo "🚀 Building images and starting all services..."
  $DC up --build
fi
