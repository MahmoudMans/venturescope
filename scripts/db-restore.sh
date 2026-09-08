#!/usr/bin/env bash

set -euo pipefail

BACKUP="${1:-${VENTURESCOPE_BACKUP_FILE:-}}"

COMPOSE_FILE="${VENTURESCOPE_DB_COMPOSE_FILE:-compose.production.yaml}"

DB_SERVICE="${VENTURESCOPE_DB_SERVICE:-postgres}"

DB_USER="${POSTGRES_USER:-venturescope}"

DB_NAME="${POSTGRES_DB:-venturescope}"


if [[ -z "${BACKUP}" ]]; then

  echo "[ERROR] Backup file is required."

  exit 1

fi


if [[ ! -s "${BACKUP}" ]]; then

  echo "[ERROR] Backup file does not exist or is empty:"
  echo "  ${BACKUP}"

  exit 1

fi


if [[ "${VENTURESCOPE_ALLOW_RESTORE:-NO}" != "YES" ]]; then

  echo "============================================================"
  echo "RESTORE BLOCKED"
  echo "============================================================"
  echo
  echo "Database restore is destructive."
  echo
  echo "To authorize an intentional restore, run:"
  echo
  echo "  VENTURESCOPE_ALLOW_RESTORE=YES \\"
  echo "    pnpm db:restore -- ${BACKUP}"
  echo
  echo "No database changes were made."

  exit 1

fi


echo "============================================================"
echo "VENTURESCOPE — POSTGRESQL RESTORE"
echo "============================================================"
echo
echo "COMPOSE_FILE=${COMPOSE_FILE}"
echo "DB_SERVICE=${DB_SERVICE}"
echo "DB_NAME=${DB_NAME}"
echo "BACKUP=${BACKUP}"
echo


docker compose \
  -f "${COMPOSE_FILE}" \
  exec \
  -T \
  "${DB_SERVICE}" \
  pg_restore \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --exit-on-error \
  < "${BACKUP}"


echo
echo "[PASS] PostgreSQL restore completed"
