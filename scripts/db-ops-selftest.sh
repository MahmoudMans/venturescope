#!/usr/bin/env bash

set -euo pipefail

COMPOSE_FILE="compose.e2e.yaml"

DATABASE_URL="postgresql://venturescope_e2e:venturescope_e2e@127.0.0.1:55438/venturescope_e2e?schema=public"

DB_USER="venturescope_e2e"
DB_NAME="venturescope_e2e"

BACKUP="/tmp/venturescope-step17-db-selftest.dump"


if [[ ! -f "${COMPOSE_FILE}" ]]; then

  echo "[ERROR] E2E Compose file not found."

  exit 1

fi


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


cleanup() {
  rm -f \
    "${BACKUP}"

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
echo "VENTURESCOPE — DATABASE OPERATIONS SELF-TEST"
echo "============================================================"
echo
echo "DB_SERVICE=${DB_SERVICE}"


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


DATABASE_URL="${DATABASE_URL}" \
pnpm exec prisma db push \
  --force-reset


docker compose \
  -f "${COMPOSE_FILE}" \
  exec \
  -T \
  "${DB_SERVICE}" \
  psql \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --set=ON_ERROR_STOP=1 \
    --command='
      CREATE TABLE IF NOT EXISTS "Step17BackupProbe" (
        id INTEGER PRIMARY KEY,
        value TEXT NOT NULL
      );

      TRUNCATE TABLE "Step17BackupProbe";

      INSERT INTO "Step17BackupProbe" (
        id,
        value
      )
      VALUES (
        17,
        '\''backup-restore-ok'\''
      );
    '


VENTURESCOPE_DB_COMPOSE_FILE="${COMPOSE_FILE}" \
VENTURESCOPE_DB_SERVICE="${DB_SERVICE}" \
POSTGRES_USER="${DB_USER}" \
POSTGRES_DB="${DB_NAME}" \
bash scripts/db-backup.sh \
  "${BACKUP}"


VENTURESCOPE_DB_COMPOSE_FILE="${COMPOSE_FILE}" \
VENTURESCOPE_DB_SERVICE="${DB_SERVICE}" \
bash scripts/db-verify-backup.sh \
  "${BACKUP}"


docker compose \
  -f "${COMPOSE_FILE}" \
  exec \
  -T \
  "${DB_SERVICE}" \
  psql \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --set=ON_ERROR_STOP=1 \
    --command='
      DROP TABLE "Step17BackupProbe";
    '


VENTURESCOPE_ALLOW_RESTORE="YES" \
VENTURESCOPE_DB_COMPOSE_FILE="${COMPOSE_FILE}" \
VENTURESCOPE_DB_SERVICE="${DB_SERVICE}" \
POSTGRES_USER="${DB_USER}" \
POSTGRES_DB="${DB_NAME}" \
bash scripts/db-restore.sh \
  "${BACKUP}"


RESTORED_VALUE="$(
  docker compose \
    -f "${COMPOSE_FILE}" \
    exec \
    -T \
    "${DB_SERVICE}" \
    psql \
      --username="${DB_USER}" \
      --dbname="${DB_NAME}" \
      --tuples-only \
      --no-align \
      --command='
        SELECT value
        FROM "Step17BackupProbe"
        WHERE id = 17;
      ' \
    | tr \
        -d \
        '\r[:space:]'
)"


if [[ "${RESTORED_VALUE}" != "backup-restore-ok" ]]; then

  echo "[ERROR] Restored database probe does not match."

  echo "VALUE=${RESTORED_VALUE}"

  exit 1

fi


echo
echo "[PASS] Backup created"
echo "[PASS] Backup archive verified"
echo "[PASS] Disposable database modified"
echo "[PASS] Backup restored"
echo "[PASS] Restored data verified"
echo
echo "DATABASE_OPERATIONS_SELFTEST=PASS"
