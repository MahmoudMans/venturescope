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

STATE_DIR="$(
  deployment_state_dir
)"

CURRENT_STATE="${STATE_DIR}/current.env"

DRY_RUN="${VENTURESCOPE_ROLLBACK_DRY_RUN:-NO}"


if [[ "${VENTURESCOPE_ROLLBACK_CONFIRM:-NO}" != "YES" ]]; then

  echo "============================================================"
  echo "PRODUCTION ROLLBACK BLOCKED"
  echo "============================================================"
  echo
  echo "An explicit rollback confirmation is required."
  echo
  echo "Application-only rollback:"
  echo
  echo "  VENTURESCOPE_ROLLBACK_CONFIRM=YES \\"
  echo "  pnpm deploy:rollback"
  echo
  echo "Database restore is NEVER automatic."

  exit 1

fi


if [[ ! -f "${CURRENT_STATE}" ]]; then

  echo "[ERROR] Current deployment state is missing:"
  echo "  ${CURRENT_STATE}"

  exit 1

fi


CURRENT_RELEASE="$(
  state_value \
    RELEASE_ID \
    "${CURRENT_STATE}"
)"

CURRENT_IMAGE="$(
  state_value \
    RELEASE_IMAGE \
    "${CURRENT_STATE}"
)"

PREVIOUS_IMAGE="$(
  state_value \
    PREVIOUS_IMAGE \
    "${CURRENT_STATE}"
)"

PREVIOUS_VERSION="$(
  state_value \
    PREVIOUS_VERSION \
    "${CURRENT_STATE}"
)"

BACKUP_FILE="$(
  state_value \
    BACKUP_FILE \
    "${CURRENT_STATE}"
)"

PRODUCTION_URL="$(
  state_value \
    PRODUCTION_URL \
    "${CURRENT_STATE}"
)"


if [[ -z "${PREVIOUS_IMAGE}" ]]; then

  echo "[ERROR] No previous application image was recorded."
  echo
  echo "Current release:"
  echo "  ${CURRENT_RELEASE}"

  exit 1

fi


if [[ -z "${PRODUCTION_URL}" ]]; then

  echo "[ERROR] Current deployment state has no production URL."

  exit 1

fi


echo "============================================================"
echo "VENTURESCOPE — PRODUCTION ROLLBACK"
echo "============================================================"
echo
echo "CURRENT_RELEASE=${CURRENT_RELEASE}"
echo "CURRENT_IMAGE=${CURRENT_IMAGE}"
echo "TARGET_IMAGE=${PREVIOUS_IMAGE}"
echo "TARGET_VERSION=${PREVIOUS_VERSION:-UNKNOWN}"
echo "PRODUCTION_URL=${PRODUCTION_URL}"
echo "DATABASE_RESTORE=${VENTURESCOPE_ROLLBACK_DATABASE:-NO}"
echo


if [[ "${DRY_RUN}" == "YES" ]]; then

  echo "ROLLBACK_MODE=DRY_RUN"
  echo
  echo "[PLAN] acquire deployment lock"
  echo "[PLAN] switch application to ${PREVIOUS_IMAGE}"

  if [[ "${VENTURESCOPE_ROLLBACK_DATABASE:-NO}" == "YES" ]]; then

    echo "[PLAN] stop application"
    echo "[PLAN] explicitly restore ${BACKUP_FILE}"
    echo "[PLAN] restart previous application image"

  else

    echo "[PLAN] database remains untouched"

  fi

  echo "[PLAN] run expected-version production smoke"
  echo "[PLAN] persist rollback release state"

  exit 0

fi


acquire_deployment_lock \
  "${STATE_DIR}" \
  "rollback:${CURRENT_RELEASE}"


trap '
  status=$?
  release_deployment_lock
  exit "${status}"
' EXIT


if [[ "${VENTURESCOPE_ROLLBACK_DATABASE:-NO}" == "YES" ]]; then

  if [[ "${VENTURESCOPE_ALLOW_RESTORE:-NO}" != "YES" ]]; then

    echo "[ERROR] Database rollback requires BOTH:"
    echo
    echo "  VENTURESCOPE_ROLLBACK_DATABASE=YES"
    echo "  VENTURESCOPE_ALLOW_RESTORE=YES"

    exit 1

  fi


  if [[ -z "${BACKUP_FILE}" || ! -f "${BACKUP_FILE}" ]]; then

    echo "[ERROR] Required pre-deployment backup is unavailable:"
    echo "  ${BACKUP_FILE}"

    exit 1

  fi


  echo
  echo "[ROLLBACK 1/4] Stopping application before database restore..."

  docker compose \
    -f "${COMPOSE_FILE}" \
    stop \
    "${APP_SERVICE}"


  echo
  echo "[ROLLBACK 2/4] Restoring pre-deployment PostgreSQL backup..."

  VENTURESCOPE_ALLOW_RESTORE="YES" \
  VENTURESCOPE_DB_COMPOSE_FILE="${COMPOSE_FILE}" \
  pnpm db:restore -- \
    "${BACKUP_FILE}"


  echo "[PASS] Database restored"

else

  echo
  echo "[ROLLBACK] Database restore intentionally skipped."

fi


echo
echo "[ROLLBACK 3/4] Restoring previous application image..."

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


echo "[PASS] Previous application image started"


echo
echo "[ROLLBACK 4/4] Running production smoke verification..."

if [[ -n "${PREVIOUS_VERSION}" ]]; then

  VENTURESCOPE_EXPECTED_VERSION="${PREVIOUS_VERSION}" \
  pnpm ops:smoke -- \
    "${PRODUCTION_URL}"

else

  pnpm ops:smoke -- \
    "${PRODUCTION_URL}"

fi


ROLLBACK_ID="rollback-$(
  deployment_timestamp
)"


ROLLBACK_STATE="${STATE_DIR}/releases/${ROLLBACK_ID}.env"


write_release_state \
  "${ROLLBACK_STATE}" \
  "${ROLLBACK_ID}" \
  "${PREVIOUS_IMAGE}" \
  "${CURRENT_IMAGE}" \
  "${CURRENT_RELEASE}" \
  "${BACKUP_FILE}" \
  "${PRODUCTION_URL}" \
  "$(
    git rev-parse \
      HEAD
  )" \
  "$(
    deployment_timestamp
  )"


cp \
  "${ROLLBACK_STATE}" \
  "${STATE_DIR}/current.env"


printf '%s\n' \
  "${ROLLBACK_ID}" \
  > "${STATE_DIR}/current-release"


echo
echo "============================================================"
echo "PRODUCTION ROLLBACK COMPLETE"
echo "============================================================"
echo
echo "ROLLBACK_ID=${ROLLBACK_ID}"
echo "APPLICATION_IMAGE=${PREVIOUS_IMAGE}"
echo "DATABASE_RESTORED=$(
  if [[ "${VENTURESCOPE_ROLLBACK_DATABASE:-NO}" == "YES" ]]; then
    printf 'YES'
  else
    printf 'NO'
  fi
)"
