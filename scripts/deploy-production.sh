#!/usr/bin/env bash

set -euo pipefail


ROOT="$(
  cd \
    "$(
      dirname \
        "${BASH_SOURCE[0]}"
    )/.." \
    >/dev/null 2>&1 \
  && pwd
)"

cd "${ROOT}"


source \
  scripts/lib/deployment-common.sh


COMPOSE_FILE="${VENTURESCOPE_DEPLOY_COMPOSE_FILE:-compose.production.yaml}"

RELEASE_COMPOSE_FILE="${VENTURESCOPE_RELEASE_COMPOSE_FILE:-compose.release.yaml}"

APP_SERVICE="${VENTURESCOPE_APP_SERVICE:-app}"

MIGRATION_SERVICE="${VENTURESCOPE_MIGRATION_SERVICE:-migrate}"

STATE_DIR="$(
  deployment_state_dir
)"

PRODUCTION_URL="${VENTURESCOPE_PRODUCTION_URL:-}"

DRY_RUN="${VENTURESCOPE_DEPLOY_DRY_RUN:-NO}"


RELEASE_ID="${1:-}"

if [[ -z "${RELEASE_ID}" ]]; then

  RELEASE_ID="$(
    git rev-parse \
      --short=12 \
      HEAD
  )"

fi


validate_release_id \
  "${RELEASE_ID}"


if [[ "${VENTURESCOPE_DEPLOY_CONFIRM:-NO}" != "YES" ]]; then

  echo "============================================================"
  echo "PRODUCTION DEPLOYMENT BLOCKED"
  echo "============================================================"
  echo
  echo "An explicit production deployment confirmation is required."
  echo
  echo "Run:"
  echo
  echo "  VENTURESCOPE_DEPLOY_CONFIRM=YES \\"
  echo "  VENTURESCOPE_PRODUCTION_URL=https://your-domain.com \\"
  echo "  pnpm deploy:production -- ${RELEASE_ID}"
  echo
  echo "No production changes were made."

  exit 1

fi


if [[ -z "${PRODUCTION_URL}" ]]; then

  echo "[ERROR] VENTURESCOPE_PRODUCTION_URL is required."

  exit 1

fi


GIT_SHA="$(
  git rev-parse \
    HEAD
)"


RELEASE_IMAGE="${VENTURESCOPE_RELEASE_IMAGE:-venturescope:${RELEASE_ID}}"

TIMESTAMP="$(
  deployment_timestamp
)"

BACKUP_FILE="${VENTURESCOPE_PREDEPLOY_BACKUP:-backups/predeploy-${RELEASE_ID}-${TIMESTAMP}.dump}"


echo "============================================================"
echo "VENTURESCOPE — PRODUCTION DEPLOYMENT"
echo "============================================================"
echo
echo "RELEASE_ID=${RELEASE_ID}"
echo "GIT_SHA=${GIT_SHA}"
echo "RELEASE_IMAGE=${RELEASE_IMAGE}"
echo "PRODUCTION_URL=${PRODUCTION_URL}"
echo "COMPOSE_FILE=${COMPOSE_FILE}"
echo "APP_SERVICE=${APP_SERVICE}"
echo "MIGRATION_SERVICE=${MIGRATION_SERVICE}"
echo "BACKUP_FILE=${BACKUP_FILE}"
echo


if [[ "${DRY_RUN}" == "YES" ]]; then

  echo "DEPLOYMENT_MODE=DRY_RUN"
  echo
  echo "[PLAN] acquire deployment lock"
  echo "[PLAN] run authoritative release gate"
  echo "[PLAN] ensure production PostgreSQL is running"
  echo "[PLAN] create pre-deployment PostgreSQL backup"
  echo "[PLAN] capture currently deployed image/version"
  echo "[PLAN] build and execute Prisma migration service"
  echo "[PLAN] deploy ${RELEASE_IMAGE}"
  echo "[PLAN] verify /api/version == ${RELEASE_ID}"
  echo "[PLAN] run complete production smoke test"
  echo "[PLAN] persist deployment state"
  echo "[PLAN] automatically restore previous app image if smoke fails"
  echo "[PLAN] never automatically restore database backup"

  exit 0

fi


if [[ ! -f "${COMPOSE_FILE}" ]]; then

  echo "[ERROR] Production Compose file not found:"
  echo "  ${COMPOSE_FILE}"

  exit 1

fi


if [[ ! -f "${RELEASE_COMPOSE_FILE}" ]]; then

  echo "[ERROR] Release Compose override not found:"
  echo "  ${RELEASE_COMPOSE_FILE}"

  exit 1

fi


acquire_deployment_lock \
  "${STATE_DIR}" \
  "deploy:${RELEASE_ID}"


trap '
  status=$?
  release_deployment_lock
  exit "${status}"
' EXIT


echo
echo "[DEPLOY 1/10] Validating production Compose configuration..."

docker compose \
  -f "${COMPOSE_FILE}" \
  config \
  >/dev/null


VENTURESCOPE_APP_IMAGE="${RELEASE_IMAGE}" \
docker compose \
  -f "${COMPOSE_FILE}" \
  -f "${RELEASE_COMPOSE_FILE}" \
  config \
  >/dev/null


echo "[PASS] Production Compose configuration valid"


echo
echo "[DEPLOY 2/10] Running authoritative release gate..."

VENTURESCOPE_RELEASE_IMAGE="${RELEASE_IMAGE}" \
pnpm release:gate


echo
echo "[DEPLOY 3/10] Ensuring production database is running..."

docker compose \
  -f "${COMPOSE_FILE}" \
  up \
  -d \
  postgres


echo
echo "[DEPLOY 4/10] Creating pre-deployment database backup..."

VENTURESCOPE_DB_COMPOSE_FILE="${COMPOSE_FILE}" \
pnpm db:backup -- \
  "${BACKUP_FILE}"


VENTURESCOPE_DB_COMPOSE_FILE="${COMPOSE_FILE}" \
pnpm db:backup:verify -- \
  "${BACKUP_FILE}"


echo
echo "[DEPLOY 5/10] Capturing currently deployed application state..."

PREVIOUS_IMAGE="$(
  current_application_image \
    "${COMPOSE_FILE}" \
    "${APP_SERVICE}"
)"


PREVIOUS_VERSION="$(
  current_remote_version \
    "${PRODUCTION_URL}"
)"


echo "PREVIOUS_IMAGE=${PREVIOUS_IMAGE:-NONE}"
echo "PREVIOUS_VERSION=${PREVIOUS_VERSION:-UNKNOWN}"


PENDING_STATE="${STATE_DIR}/releases/${RELEASE_ID}.pending.env"


write_release_state \
  "${PENDING_STATE}" \
  "${RELEASE_ID}" \
  "${RELEASE_IMAGE}" \
  "${PREVIOUS_IMAGE}" \
  "${PREVIOUS_VERSION}" \
  "${BACKUP_FILE}" \
  "${PRODUCTION_URL}" \
  "${GIT_SHA}" \
  "${TIMESTAMP}"


echo "[PASS] Pending release state recorded"


echo
echo "[DEPLOY 6/10] Building migration service..."

docker compose \
  -f "${COMPOSE_FILE}" \
  build \
  "${MIGRATION_SERVICE}"


echo
echo "[DEPLOY 7/10] Applying forward database migrations..."

APP_VERSION="${RELEASE_ID}" \
docker compose \
  -f "${COMPOSE_FILE}" \
  run \
  --rm \
  "${MIGRATION_SERVICE}"


echo "[PASS] Production migrations applied"


echo
echo "[DEPLOY 8/10] Rolling out application image..."

APP_VERSION="${RELEASE_ID}" \
VENTURESCOPE_APP_IMAGE="${RELEASE_IMAGE}" \
docker compose \
  -f "${COMPOSE_FILE}" \
  -f "${RELEASE_COMPOSE_FILE}" \
  up \
  -d \
  --no-build \
  --wait \
  "${APP_SERVICE}"


echo "[PASS] Application container started"


echo
echo "[DEPLOY 9/10] Running expected-version production smoke test..."

set +e

VENTURESCOPE_EXPECTED_VERSION="${RELEASE_ID}" \
pnpm ops:smoke -- \
  "${PRODUCTION_URL}"

SMOKE_STATUS=$?

set -e


if [[ "${SMOKE_STATUS}" -ne 0 ]]; then

  echo
  echo "============================================================"
  echo "NEW RELEASE SMOKE TEST FAILED"
  echo "============================================================"

  if [[ -n "${PREVIOUS_IMAGE}" ]]; then

    echo
    echo "[ROLLBACK] Restoring previous application image:"
    echo "  ${PREVIOUS_IMAGE}"
    echo
    echo "[IMPORTANT] Database is NOT automatically restored."

    APP_VERSION="${PREVIOUS_VERSION:-rollback}" \
    VENTURESCOPE_APP_IMAGE="${PREVIOUS_IMAGE}" \
    docker compose \
      -f "${COMPOSE_FILE}" \
      -f "${RELEASE_COMPOSE_FILE}" \
      up \
      -d \
      --no-build \
      --wait \
      "${APP_SERVICE}"


    if [[ -n "${PREVIOUS_VERSION}" ]]; then

      VENTURESCOPE_EXPECTED_VERSION="${PREVIOUS_VERSION}" \
      pnpm ops:smoke -- \
        "${PRODUCTION_URL}"

    else

      pnpm ops:smoke -- \
        "${PRODUCTION_URL}"

    fi


    echo "[PASS] Previous application image restored"

  else

    echo
    echo "[WARN] No previous application image exists."
    echo "[WARN] Automatic application rollback is unavailable."

  fi


  mv \
    "${PENDING_STATE}" \
    "${STATE_DIR}/releases/${RELEASE_ID}.failed.env"


  exit \
    "${SMOKE_STATUS}"

fi


echo "[PASS] Production smoke test passed"


echo
echo "[DEPLOY 10/10] Promoting release state..."

FINAL_STATE="${STATE_DIR}/releases/${RELEASE_ID}.env"


mv \
  "${PENDING_STATE}" \
  "${FINAL_STATE}"


cp \
  "${FINAL_STATE}" \
  "${STATE_DIR}/current.env"


printf '%s\n' \
  "${RELEASE_ID}" \
  > "${STATE_DIR}/current-release"


echo
echo "============================================================"
echo "PRODUCTION DEPLOYMENT COMPLETE"
echo "============================================================"
echo
echo "RELEASE_ID=${RELEASE_ID}"
echo "RELEASE_IMAGE=${RELEASE_IMAGE}"
echo "STATE=${FINAL_STATE}"
echo "BACKUP=${BACKUP_FILE}"
echo
echo "APPLICATION_ROLLBACK_AVAILABLE=$(
  if [[ -n "${PREVIOUS_IMAGE}" ]]; then
    printf 'YES'
  else
    printf 'NO'
  fi
)"
echo
echo "DATABASE_ROLLBACK_AUTOMATIC=NO"
