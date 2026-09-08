#!/usr/bin/env bash

set -euo pipefail

BACKUP="${1:-${VENTURESCOPE_BACKUP_FILE:-}}"

COMPOSE_FILE="${VENTURESCOPE_DB_COMPOSE_FILE:-compose.production.yaml}"

DB_SERVICE="${VENTURESCOPE_DB_SERVICE:-postgres}"


if [[ -z "${BACKUP}" ]]; then

  echo "[ERROR] Backup file is required."

  exit 1

fi


if [[ ! -s "${BACKUP}" ]]; then

  echo "[ERROR] Backup file does not exist or is empty:"
  echo "  ${BACKUP}"

  exit 1

fi


docker compose \
  -f "${COMPOSE_FILE}" \
  exec \
  -T \
  "${DB_SERVICE}" \
  pg_restore \
    --list \
  < "${BACKUP}" \
  >/dev/null


echo "[PASS] PostgreSQL backup archive is readable"
echo "BACKUP=${BACKUP}"
