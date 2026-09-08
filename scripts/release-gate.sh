#!/usr/bin/env bash

set -euo pipefail

DOCKER_IMAGE="${VENTURESCOPE_RELEASE_IMAGE:-venturescope:release-gate}"

DOCKER_LOG="${VENTURESCOPE_RELEASE_DOCKER_LOG:-/tmp/venturescope-release-gate-docker.log}"


echo "============================================================"
echo "VENTURESCOPE — AUTHORITATIVE RELEASE GATE"
echo "============================================================"
echo


echo "[1/8] Prisma..."

pnpm exec prisma format
pnpm exec prisma validate
pnpm exec prisma generate


echo
echo "[2/8] ESLint..."

pnpm exec eslint . \
  --max-warnings=0


echo
echo "[3/8] TypeScript..."

pnpm typecheck


echo
echo "[4/8] Vitest..."

pnpm test


echo
echo "[5/8] Database backup/restore operations..."

pnpm db:ops:selftest


echo
echo "[6/8] Browser + security + accessibility + release E2E..."

pnpm test:e2e


echo
echo "[7/8] Production Compose..."

AUTH_SECRET='venturescope-release-gate-secret-000000000000' \
POSTGRES_PASSWORD='venturescope-release-gate-password' \
APP_ORIGIN='https://venturescope.example.com' \
NEXT_PUBLIC_SITE_URL='https://venturescope.example.com' \
TRUST_PROXY_HEADERS='true' \
docker compose \
  -f compose.production.yaml \
  config \
  >/dev/null


echo "[PASS] Production Compose valid"


echo
echo "[8/8] Production Docker..."

rm -f \
  "${DOCKER_LOG}"


docker build \
  --target runner \
  --tag "${DOCKER_IMAGE}" \
  . \
  2>&1 \
  | tee \
      "${DOCKER_LOG}"


if grep -E \
  'SecretsUsedInArgOrEnv|failed to solve|ERROR:' \
  "${DOCKER_LOG}" \
  >/dev/null 2>&1
then

  echo "[ERROR] Production Docker release gate failed."

  exit 1

fi


echo
echo "============================================================"
echo "VENTURESCOPE RELEASE GATE PASSED"
echo "============================================================"
echo
echo "PRISMA=PASS"
echo "ESLINT=PASS"
echo "TYPESCRIPT=PASS"
echo "VITEST=PASS"
echo "DATABASE_BACKUP_RESTORE=PASS"
echo "PLAYWRIGHT=PASS"
echo "SECURITY=PASS"
echo "ACCESSIBILITY=PASS"
echo "RELEASE_OPERATIONS=PASS"
echo "PRODUCTION_COMPOSE=PASS"
echo "PRODUCTION_DOCKER=PASS"
