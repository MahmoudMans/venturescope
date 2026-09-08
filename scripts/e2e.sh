#!/usr/bin/env bash

set -euo pipefail

ROOT="$(
  cd "$(
    dirname "${BASH_SOURCE[0]}"
  )/.." &&
  pwd
)"

cd "${ROOT}"

COMPOSE_FILE="${ROOT}/compose.e2e.yaml"

export E2E_DATABASE_URL="${E2E_DATABASE_URL:-postgresql://venturescope_e2e:venturescope_e2e@127.0.0.1:55438/venturescope_e2e?schema=public}"

export DATABASE_URL="${E2E_DATABASE_URL}"

export E2E_BASE_URL="${E2E_BASE_URL:-http://127.0.0.1:3100}"

export E2E_AUTH_SECRET="${E2E_AUTH_SECRET:-venturescope-e2e-auth-secret-2026-local-testing-only}"

export AUTH_SECRET="${E2E_AUTH_SECRET}"
export AUTH_URL="${E2E_BASE_URL}"
export NEXTAUTH_URL="${E2E_BASE_URL}"
export AUTH_TRUST_HOST="true"
export PLAYWRIGHT_TEST="1"

KEEP_DB="${E2E_KEEP_DB:-0}"

cleanup() {
  local status=$?

  echo

  if [[ "${KEEP_DB}" == "1" ]]; then
    echo "[INFO] E2E_KEEP_DB=1 — leaving disposable PostgreSQL running."
  else
    echo "[INFO] Removing disposable E2E PostgreSQL database..."

    docker compose \
      -f "${COMPOSE_FILE}" \
      down \
      -v \
      --remove-orphans \
      >/dev/null 2>&1 \
      || true
  fi

  exit "${status}"
}

trap cleanup EXIT

echo "============================================================"
echo "VENTURESCOPE — ISOLATED BROWSER E2E"
echo "============================================================"
echo
echo "DATABASE_URL=${E2E_DATABASE_URL}"
echo "BASE_URL=${E2E_BASE_URL}"
echo

echo "[E2E 1/5] Removing any previous disposable database..."

docker compose \
  -f "${COMPOSE_FILE}" \
  down \
  -v \
  --remove-orphans \
  >/dev/null 2>&1 \
  || true

echo
echo "[E2E 2/5] Starting PostgreSQL..."

docker compose \
  -f "${COMPOSE_FILE}" \
  up \
  -d \
  --wait

echo
echo "[E2E 3/5] Building clean database schema..."

pnpm exec prisma generate

pnpm exec prisma db push \
  --force-reset

echo
echo "[E2E 4/5] Creating production Next.js build..."

rm -rf .next

pnpm build

echo
echo "[E2E 5/5] Running Chromium browser suite..."

ARGS=(
  "--project=chromium"
)

if [[ "${E2E_HEADED:-0}" == "1" ]]; then
  ARGS+=(
    "--headed"
  )
fi

pnpm exec playwright test \
  "${ARGS[@]}"

echo
echo "============================================================"
echo "ISOLATED BROWSER E2E PASSED"
echo "============================================================"
