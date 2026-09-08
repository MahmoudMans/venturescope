#!/usr/bin/env bash

set -euo pipefail

COMPOSE_FILE="${VENTURESCOPE_DB_COMPOSE_FILE:-compose.production.yaml}"

DB_SERVICE="${VENTURESCOPE_DB_SERVICE:-postgres}"

DB_USER="${POSTGRES_USER:-venturescope}"

DB_NAME="${POSTGRES_DB:-venturescope}"

OUTPUT="${1:-backups/venturescope-$(date -u +%Y%m%dT%H%M%SZ).dump}"


if ! command -v \
  docker \
  >/dev/null 2>&1
then

  echo "[ERROR] Docker is required."

  exit 1

fi


if [[ ! -f "${COMPOSE_FILE}" ]]; then

  echo "[ERROR] Compose file not found:"
  echo "  ${COMPOSE_FILE}"

  exit 1

fi


mkdir -p \
  "$(
    dirname \
      "${OUTPUT}"
  )"


TEMP_OUTPUT="${OUTPUT}.partial"

rm -f \
  "${TEMP_OUTPUT}"


cleanup() {
  rm -f \
    "${TEMP_OUTPUT}"
}

trap cleanup EXIT


echo "============================================================"
echo "VENTURESCOPE — POSTGRESQL BACKUP"
echo "============================================================"
echo
echo "COMPOSE_FILE=${COMPOSE_FILE}"
echo "DB_SERVICE=${DB_SERVICE}"
echo "DB_NAME=${DB_NAME}"
echo "OUTPUT=${OUTPUT}"
echo


docker compose \
  -f "${COMPOSE_FILE}" \
  exec \
  -T \
  "${DB_SERVICE}" \
  pg_dump \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --format=custom \
    --no-owner \
    --no-privileges \
  > "${TEMP_OUTPUT}"


if [[ ! -s "${TEMP_OUTPUT}" ]]; then

  echo "[ERROR] PostgreSQL backup is empty."

  exit 1

fi


mv \
  "${TEMP_OUTPUT}" \
  "${OUTPUT}"


BYTES="$(
  wc \
    -c \
    < "${OUTPUT}" \
    | tr \
        -d \
        ' '
)"


echo
echo "[PASS] PostgreSQL backup created"
echo "BACKUP=${OUTPUT}"
echo "BYTES=${BYTES}"
