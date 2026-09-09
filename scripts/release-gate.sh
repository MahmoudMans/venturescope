#!/usr/bin/env bash

set -euo pipefail

DOCKER_IMAGE="${VENTURESCOPE_RELEASE_IMAGE:-venturescope:release-gate}"

DOCKER_LOG="${VENTURESCOPE_RELEASE_DOCKER_LOG:-/tmp/venturescope-release-gate-docker.log}"


echo "============================================================"
echo "VENTURESCOPE — AUTHORITATIVE RELEASE GATE"
echo "============================================================"
echo


echo "[1/28] Prisma..."

pnpm exec prisma format
pnpm exec prisma validate
pnpm exec prisma generate


echo
echo "[2/28] ESLint..."

pnpm exec eslint . \
  --max-warnings=0


echo
echo "[3/28] TypeScript..."

pnpm typecheck


echo
echo "[4/28] Vitest..."

pnpm test


echo
echo "[5/28] Prisma migration chain..."

pnpm db:migrations:selftest


echo
echo "[6/28] Database backup/restore operations..."

pnpm db:ops:selftest


echo
echo "[7/28] Deployment and rollback control plane..."

pnpm deploy:selftest


echo
echo "[8/28] Observability contract..."

pnpm test:observability


echo
echo "[9/28] Account security and session lifecycle..."

pnpm test:account-security


echo
echo "[10/28] Collaboration authorization..."

pnpm test:collaboration


echo
echo
echo "[11/28] Model versioning and immutable restore..."

pnpm test:versioning


echo
echo "[12/28] Advanced financial analytics..."

pnpm test:analytics


echo
echo "[13/28] Actuals and forecast variance..."

pnpm test:actuals


echo
echo "[14/28] Forecast accuracy and bias intelligence..."

pnpm test:forecast-accuracy


echo
echo "[15/28] Rolling reforecast and planning baselines..."

pnpm test:planning-cycle


echo
echo "[16/28] Liquidity risk and financial guardrails..."

pnpm test:risk-center


echo
echo "[17/28] Funding strategy and capital planning..."

pnpm test:capital-planning


echo
echo "[18/28] Executive decision center and action register..."

pnpm test:decision-center


echo
echo "[19/28] Board room and executive review snapshots..."

pnpm test:board-room


echo
echo "[20/28] Model version diff and change intelligence..."

pnpm test:version-diff


echo
echo "[21/28] Scenario comparison center and decision matrix..."

pnpm test:scenario-comparison


echo
echo "[22/28] Financial sensitivity lab and stress surface..."

pnpm test:sensitivity-lab


echo
echo "[23/28] KPI targets and management scorecards..."

pnpm test:scorecard


echo
echo "[24/28] Variance commentary and management explanations..."

pnpm test:variance-review


echo
echo "[25/28] Financial close and period locking..."

pnpm test:period-close


echo "[26/28] Browser + security + accessibility + operations E2E..."

pnpm test:e2e


echo
echo "[27/28] Production Compose..."

AUTH_SECRET='venturescope-release-gate-secret-000000000000' \
POSTGRES_PASSWORD='venturescope-release-gate-password' \
APP_ORIGIN='https://venturescope.example.com' \
NEXT_PUBLIC_SITE_URL='https://venturescope.example.com' \
TRUST_PROXY_HEADERS='true' \
VENTURESCOPE_DIAGNOSTICS_TOKEN='venturescope-release-gate-diagnostics-token-0000000000' \
VENTURESCOPE_SLOW_REQUEST_MS='750' \
docker compose \
  -f compose.production.yaml \
  config \
  >/dev/null


VENTURESCOPE_APP_IMAGE="${DOCKER_IMAGE}" \
AUTH_SECRET='venturescope-release-gate-secret-000000000000' \
POSTGRES_PASSWORD='venturescope-release-gate-password' \
APP_ORIGIN='https://venturescope.example.com' \
NEXT_PUBLIC_SITE_URL='https://venturescope.example.com' \
TRUST_PROXY_HEADERS='true' \
VENTURESCOPE_DIAGNOSTICS_TOKEN='venturescope-release-gate-diagnostics-token-0000000000' \
VENTURESCOPE_SLOW_REQUEST_MS='750' \
docker compose \
  -f compose.production.yaml \
  -f compose.release.yaml \
  config \
  >/dev/null


echo "[PASS] Production Compose valid"
echo "[PASS] Release image override valid"


echo
echo "[28/28] Production Docker..."

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
echo "MIGRATION_CHAIN=PASS"
echo "MIGRATION_SCHEMA_DRIFT=0"
echo "ESLINT=PASS"
echo "TYPESCRIPT=PASS"
echo "VITEST=PASS"
echo "DATABASE_BACKUP_RESTORE=PASS"
echo "DEPLOYMENT_CONTROL=PASS"
echo "ROLLBACK_CONTROL=PASS"
echo "OBSERVABILITY=PASS"
echo "ACCOUNT_SECURITY=PASS"
echo "SESSION_REVOCATION=PASS"
echo "COLLABORATION=PASS"
echo "MODEL_VERSIONING=PASS"
echo "ADVANCED_ANALYTICS=PASS"
echo "ACTUALS_VARIANCE=PASS"
echo "FORECAST_ACCURACY=PASS"
echo "ROLLING_REFORECAST=PASS"
echo "LIQUIDITY_RISK=PASS"
echo "CAPITAL_PLANNING=PASS"
echo "DECISION_CENTER=PASS"
echo "BOARD_ROOM=PASS"
echo "MODEL_VERSION_DIFF=PASS"
echo "SCENARIO_COMPARISON=PASS"
echo "SENSITIVITY_LAB=PASS"
echo "KPI_TARGETS=PASS"
echo "VARIANCE_REVIEW=PASS"
echo "FINANCIAL_CLOSE=PASS"
echo "PERIOD_LOCKING=PASS"
echo "OWNER_REOPEN_GOVERNANCE=PASS"
echo "ACTUAL_PERIOD_DB_GUARD=PASS"
echo "VARIANCE_COMMENTARY=PASS"
echo "MANAGEMENT_EXPLANATIONS=PASS"
echo "MANAGEMENT_SCORECARD=PASS"
echo "KPI_TARGET_HEALTH=PASS"
echo "STRESS_SURFACE=PASS"
echo "FUNDING_RESILIENCE_BOUNDARY=PASS"
echo "SCENARIO_DECISION_MATRIX=PASS"
echo "SCENARIO_AUTHORITY_PRESERVED=PASS"
echo "CHANGE_INTELLIGENCE=PASS"
echo "REVISION_IMMUTABILITY=PASS"
echo "EXECUTIVE_REVIEWS=PASS"
echo "REVIEW_IMMUTABILITY=PASS"
echo "EXECUTIVE_SIGNALS=PASS"
echo "ACTION_REGISTER=PASS"
echo "FUNDING_GAP=PASS"
echo "CAPITAL_STRUCTURE=PASS"
echo "FINANCIAL_GUARDRAILS=PASS"
echo "DOWNSIDE_STRESS=PASS"
echo "FORECAST_BASELINES=PASS"
echo "PLANNING_CYCLE=PASS"
echo "FORECAST_BIAS=PASS"
echo "ROLLING_ACCURACY=PASS"
echo "ACTUALS_IMPORT=PASS"
echo "DCF_SENSITIVITY=PASS"
echo "UNIT_ECONOMICS=PASS"
echo "IMMUTABLE_RESTORE=PASS"
echo "WORKSPACE_RBAC=PASS"
echo "PLAYWRIGHT=PASS"
echo "SECURITY=PASS"
echo "ACCESSIBILITY=PASS"
echo "RELEASE_OPERATIONS=PASS"
echo "PRODUCTION_COMPOSE=PASS"
echo "RELEASE_OVERRIDE=PASS"
echo "PRODUCTION_DOCKER=PASS"
