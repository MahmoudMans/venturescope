#!/usr/bin/env bash

set -euo pipefail


BASE_URL="${1:-${VENTURESCOPE_BASE_URL:-}}"

TOKEN="${2:-${VENTURESCOPE_DIAGNOSTICS_TOKEN:-}}"


if [[ -z "${BASE_URL}" ]]; then

  echo "[ERROR] Diagnostics base URL is required."
  echo
  echo "Usage:"
  echo "  pnpm ops:diagnostics -- https://your-domain.com TOKEN"

  exit 1

fi


if [[ "${TOKEN}" == "" || "${#TOKEN}" -lt 32 ]]; then

  echo "[ERROR] Diagnostics token must contain at least 32 characters."

  exit 1

fi


BASE_URL="${BASE_URL%/}"

REQUEST_ID="diagnostics-$(
  date \
    -u \
    +%Y%m%dT%H%M%SZ
)-$$"


TMP_DIR="$(
  mktemp \
    -d \
    "${TMPDIR:-/tmp}/venturescope-diagnostics.XXXXXX"
)"


cleanup() {
  rm -rf \
    "${TMP_DIR}"
}

trap cleanup EXIT


HEADERS="${TMP_DIR}/headers"

BODY="${TMP_DIR}/body"


STATUS="$(
  curl \
    --silent \
    --show-error \
    --max-time 20 \
    --connect-timeout 8 \
    --dump-header "${HEADERS}" \
    --output "${BODY}" \
    --write-out '%{http_code}' \
    --header "Authorization: Bearer ${TOKEN}" \
    --header "X-Request-Id: ${REQUEST_ID}" \
    "${BASE_URL}/api/diagnostics"
)"


if [[ "${STATUS}" != "200" ]]; then

  echo "[ERROR] Diagnostics endpoint failed."
  echo "HTTP=${STATUS}"

  exit 1

fi


if ! grep -Ei \
  "^x-request-id:[[:space:]]*${REQUEST_ID}" \
  "${HEADERS}" \
  >/dev/null
then

  echo "[ERROR] Diagnostics response did not preserve correlation ID."

  exit 1

fi


python3 \
  - "${BODY}" \
  <<'PY'
import json
import sys
from pathlib import Path


payload = json.loads(
    Path(
        sys.argv[1]
    ).read_text()
)


if (
    payload.get(
        "status"
    ) !=
    "ok"
):
    raise SystemExit(
        "[ERROR] Diagnostics status is not ok."
    )


diagnostics = payload.get(
    "diagnostics"
)

if not isinstance(
    diagnostics,
    dict,
):
    raise SystemExit(
        "[ERROR] Diagnostics payload missing."
    )


database = diagnostics.get(
    "database"
)

if (
    not isinstance(
        database,
        dict,
    )
    or
    database.get(
        "status"
    ) !=
    "ready"
):
    raise SystemExit(
        "[ERROR] Database diagnostics are not ready."
    )


serialized = json.dumps(
    payload
)


for forbidden in [
    "AUTH_SECRET",
    "DATABASE_URL",
    "VENTURESCOPE_DIAGNOSTICS_TOKEN",
]:
    if forbidden in serialized:
        raise SystemExit(
            f"[ERROR] Sensitive field exposed: {forbidden}"
        )


print(
    "[PASS] Diagnostics endpoint healthy"
)

print(
    "[PASS] Database probe healthy"
)

print(
    "[PASS] Diagnostics payload contains no configured secret names"
)
PY


echo
echo "============================================================"
echo "PRODUCTION DIAGNOSTICS PASSED"
echo "============================================================"
