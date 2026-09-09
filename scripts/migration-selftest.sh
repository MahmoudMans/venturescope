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


COMPOSE_FILE="${VENTURESCOPE_MIGRATION_TEST_COMPOSE_FILE:-compose.e2e.yaml}"

DATABASE_URL="${VENTURESCOPE_MIGRATION_TEST_DATABASE_URL:-postgresql://venturescope_e2e:venturescope_e2e@127.0.0.1:55438/venturescope_e2e?schema=public}"

EXPECTED_MIGRATIONS="${VENTURESCOPE_EXPECTED_MIGRATION_COUNT:-10}"


cleanup() {
  docker compose \
    -f "${COMPOSE_FILE}" \
    down \
    -v \
    --remove-orphans \
    >/dev/null 2>&1 \
    || true
}

trap cleanup EXIT


echo "============================================================"
echo "VENTURESCOPE — PRISMA MIGRATION CHAIN SELF-TEST"
echo "============================================================"
echo
echo "COMPOSE_FILE=${COMPOSE_FILE}"
echo "EXPECTED_MIGRATIONS=${EXPECTED_MIGRATIONS}"
echo


docker compose \
  -f "${COMPOSE_FILE}" \
  down \
  -v \
  --remove-orphans \
  >/dev/null 2>&1 \
  || true


docker compose \
  -f "${COMPOSE_FILE}" \
  up \
  -d \
  --wait


DB_SERVICE="$(
  docker compose \
    -f "${COMPOSE_FILE}" \
    config \
    --services \
    | sed -n \
        '1p'
)"


if [[ -z "${DB_SERVICE}" ]]; then

  echo "[ERROR] Could not discover disposable PostgreSQL service."

  exit 1

fi


echo
echo "[1/5] Applying complete migration chain to an empty PostgreSQL database..."

DATABASE_URL="${DATABASE_URL}" \
pnpm exec prisma migrate deploy


echo
echo "[2/5] Checking Prisma migration status..."

DATABASE_URL="${DATABASE_URL}" \
pnpm exec prisma migrate status


echo
echo "[3/5] Verifying migration history count..."

MIGRATION_COUNT="$(
  docker compose \
    -f "${COMPOSE_FILE}" \
    exec \
    -T \
    "${DB_SERVICE}" \
    psql \
      --username=venturescope_e2e \
      --dbname=venturescope_e2e \
      --tuples-only \
      --no-align \
      --command='
        SELECT COUNT(*)
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL
          AND rolled_back_at IS NULL;
      ' \
    | tr \
        -d \
        '[:space:]'
)"


if [[ "${MIGRATION_COUNT}" != "${EXPECTED_MIGRATIONS}" ]]; then

  echo "[ERROR] Unexpected applied migration count."
  echo "EXPECTED=${EXPECTED_MIGRATIONS}"
  echo "ACTUAL=${MIGRATION_COUNT}"

  exit 1

fi


echo "[PASS] MIGRATION_COUNT=${MIGRATION_COUNT}"


echo
echo "[4/5] Verifying Step 20 account-security columns..."

COLUMN_COUNT="$(
  docker compose \
    -f "${COMPOSE_FILE}" \
    exec \
    -T \
    "${DB_SERVICE}" \
    psql \
      --username=venturescope_e2e \
      --dbname=venturescope_e2e \
      --tuples-only \
      --no-align \
      --command="
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'User'
          AND column_name IN (
            'authVersion',
            'passwordChangedAt'
          );
      " \
    | tr \
        -d \
        '[:space:]'
)"


if [[ "${COLUMN_COUNT}" != "2" ]]; then

  echo "[ERROR] Step 20 security columns missing."
  echo "COLUMN_COUNT=${COLUMN_COUNT}"

  exit 1

fi


echo "[PASS] authVersion present"
echo "[PASS] passwordChangedAt present"


echo
echo "[5/5] Checking migrated database for Prisma-schema drift..."

DIFF_LOG="$(
  mktemp \
    "${TMPDIR:-/tmp}/venturescope-migration-diff.XXXXXX"
)"


set +e

DATABASE_URL="${DATABASE_URL}" \
pnpm exec prisma migrate diff \
  --exit-code \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  > "${DIFF_LOG}" \
  2>&1

DIFF_STATUS=$?

set -e


if [[ "${DIFF_STATUS}" -ne 0 ]]; then

  echo "[ERROR] Migrated database does not match prisma/schema.prisma."
  echo "DIFF_EXIT=${DIFF_STATUS}"
  echo

  cat \
    "${DIFF_LOG}"

  rm -f \
    "${DIFF_LOG}"

  exit 1

fi


rm -f \
  "${DIFF_LOG}"


echo "[PASS] Migration history matches Prisma schema"

echo
echo "============================================================"
echo "PRISMA MIGRATION CHAIN SELF-TEST PASSED"
echo "============================================================"
echo
echo "BASELINE_MIGRATION=PASS"
echo "ACCOUNT_SECURITY_MIGRATION=PASS"
echo "MIGRATE_DEPLOY_FROM_EMPTY=PASS"
echo "MIGRATION_STATUS=PASS"
echo "SCHEMA_DRIFT=0"
