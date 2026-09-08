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


TMP_ROOT="$(
  mktemp \
    -d \
    "${TMPDIR:-/tmp}/venturescope-deployment-selftest.XXXXXX"
)"


cleanup() {
  release_deployment_lock \
    >/dev/null 2>&1 \
    || true

  rm -rf \
    "${TMP_ROOT}"
}

trap cleanup EXIT


STATE_DIR="${TMP_ROOT}/state"


echo "============================================================"
echo "VENTURESCOPE — DEPLOYMENT CONTROL SELF-TEST"
echo "============================================================"
echo


echo "[SELFTEST 1/7] Release ID validation..."

validate_release_id \
  "release-2026.09.08"

set +e

validate_release_id \
  '../../bad release' \
  >/dev/null 2>&1

STATUS=$?

set -e


if [[ "${STATUS}" -eq 0 ]]; then

  echo "[ERROR] Invalid release ID was accepted."

  exit 1

fi


echo "[PASS] Release ID validation"


echo
echo "[SELFTEST 2/7] Atomic deployment lock..."

acquire_deployment_lock \
  "${STATE_DIR}" \
  "selftest-primary"


set +e

(
  unset VENTURESCOPE_ACTIVE_DEPLOYMENT_LOCK

  acquire_deployment_lock \
    "${STATE_DIR}" \
    "selftest-conflict"
) \
  >/dev/null 2>&1

STATUS=$?

set -e


if [[ "${STATUS}" -eq 0 ]]; then

  echo "[ERROR] Concurrent deployment lock was accepted."

  exit 1

fi


release_deployment_lock


echo "[PASS] Concurrent deployment prevented"


echo
echo "[SELFTEST 3/7] Release-state round trip..."

STATE_FILE="${STATE_DIR}/current.env"


write_release_state \
  "${STATE_FILE}" \
  "release-next" \
  "venturescope:release-next" \
  "venturescope:release-prev" \
  "release-prev" \
  "backups/predeploy.dump" \
  "https://example.invalid" \
  "abc123" \
  "20260908T190000Z"


[[ "$(
  state_value \
    RELEASE_ID \
    "${STATE_FILE}"
)" == "release-next" ]]


[[ "$(
  state_value \
    PREVIOUS_IMAGE \
    "${STATE_FILE}"
)" == "venturescope:release-prev" ]]


[[ "$(
  state_value \
    PREVIOUS_VERSION \
    "${STATE_FILE}"
)" == "release-prev" ]]


echo "[PASS] Release state read/write"


echo
echo "[SELFTEST 4/7] Deployment confirmation lock..."

set +e

VENTURESCOPE_DEPLOY_STATE_DIR="${STATE_DIR}" \
VENTURESCOPE_PRODUCTION_URL="https://example.invalid" \
bash scripts/deploy-production.sh \
  "selftest-release" \
  >/dev/null 2>&1

STATUS=$?

set -e


if [[ "${STATUS}" -eq 0 ]]; then

  echo "[ERROR] Deployment ran without explicit confirmation."

  exit 1

fi


echo "[PASS] Production deployment blocked by default"


echo
echo "[SELFTEST 5/7] Deployment dry-run plan..."

DEPLOY_PLAN="$(
  VENTURESCOPE_DEPLOY_CONFIRM="YES" \
  VENTURESCOPE_DEPLOY_DRY_RUN="YES" \
  VENTURESCOPE_DEPLOY_STATE_DIR="${STATE_DIR}" \
  VENTURESCOPE_PRODUCTION_URL="https://example.invalid" \
  bash scripts/deploy-production.sh \
    "selftest-release"
)"


printf '%s\n' \
  "${DEPLOY_PLAN}" \
  | grep -F \
      "DEPLOYMENT_MODE=DRY_RUN" \
      >/dev/null


printf '%s\n' \
  "${DEPLOY_PLAN}" \
  | grep -F \
      "never automatically restore database backup" \
      >/dev/null


echo "[PASS] Safe deployment plan generated"


echo
echo "[SELFTEST 6/7] Rollback confirmation lock..."

set +e

VENTURESCOPE_DEPLOY_STATE_DIR="${STATE_DIR}" \
bash scripts/rollback-production.sh \
  >/dev/null 2>&1

STATUS=$?

set -e


if [[ "${STATUS}" -eq 0 ]]; then

  echo "[ERROR] Rollback ran without explicit confirmation."

  exit 1

fi


echo "[PASS] Production rollback blocked by default"


echo
echo "[SELFTEST 7/7] Rollback dry-run plan..."

ROLLBACK_PLAN="$(
  VENTURESCOPE_ROLLBACK_CONFIRM="YES" \
  VENTURESCOPE_ROLLBACK_DRY_RUN="YES" \
  VENTURESCOPE_DEPLOY_STATE_DIR="${STATE_DIR}" \
  bash scripts/rollback-production.sh
)"


printf '%s\n' \
  "${ROLLBACK_PLAN}" \
  | grep -F \
      "ROLLBACK_MODE=DRY_RUN" \
      >/dev/null


printf '%s\n' \
  "${ROLLBACK_PLAN}" \
  | grep -F \
      "database remains untouched" \
      >/dev/null


echo "[PASS] Safe application rollback plan generated"


echo
echo "============================================================"
echo "DEPLOYMENT CONTROL SELF-TEST PASSED"
echo "============================================================"
echo
echo "RELEASE_ID_VALIDATION=PASS"
echo "ATOMIC_LOCK=PASS"
echo "STATE_ROUNDTRIP=PASS"
echo "DEPLOY_CONFIRMATION=PASS"
echo "DEPLOY_DRY_RUN=PASS"
echo "ROLLBACK_CONFIRMATION=PASS"
echo "ROLLBACK_DRY_RUN=PASS"
echo "AUTOMATIC_DATABASE_RESTORE=DISABLED"
