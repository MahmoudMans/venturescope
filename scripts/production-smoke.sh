#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-${VENTURESCOPE_BASE_URL:-}}"

if [[ -z "${BASE_URL}" ]]; then

  echo "[ERROR] Production base URL is required."
  echo
  echo "Usage:"
  echo "  pnpm ops:smoke -- https://venturescope.example.com"
  echo
  echo "Or:"
  echo "  VENTURESCOPE_BASE_URL=https://venturescope.example.com pnpm ops:smoke"

  exit 1

fi

BASE_URL="${BASE_URL%/}"


TMP_DIR="$(
  mktemp \
    -d \
    "${TMPDIR:-/tmp}/venturescope-smoke.XXXXXX"
)"


cleanup() {
  rm -rf \
    "${TMP_DIR}"
}

trap cleanup EXIT


request() {
  local path="$1"
  local headers="$2"
  local body="$3"

  curl \
    --silent \
    --show-error \
    --max-time 20 \
    --connect-timeout 8 \
    --dump-header "${headers}" \
    --output "${body}" \
    --write-out '%{http_code}' \
    "${BASE_URL}${path}"
}


expect_status() {
  local actual="$1"
  local expected="$2"
  local label="$3"

  if [[ "${actual}" != "${expected}" ]]; then

    echo "[ERROR] ${label}"
    echo "Expected HTTP ${expected}; received ${actual}."

    exit 1

  fi
}


echo "============================================================"
echo "VENTURESCOPE — PRODUCTION SMOKE TEST"
echo "============================================================"
echo
echo "TARGET=${BASE_URL}"
echo


for route in \
  "/" \
  "/demo" \
  "/robots.txt" \
  "/sitemap.xml"
do

  route_id="$(
    printf '%s' \
      "${route}" \
      | tr '/.' '__'
  )"

  HEADERS="${TMP_DIR}/${route_id}.headers"
  BODY="${TMP_DIR}/${route_id}.body"

  STATUS="$(
    request \
      "${route}" \
      "${HEADERS}" \
      "${BODY}"
  )"

  expect_status \
    "${STATUS}" \
    "200" \
    "Public route failed: ${route}"

  echo "[PASS] ${route} -> HTTP 200"

done


for route in \
  "/api/health" \
  "/api/ready" \
  "/api/version"
do

  route_id="$(
    printf '%s' \
      "${route}" \
      | tr '/.' '__'
  )"

  HEADERS="${TMP_DIR}/${route_id}.headers"
  BODY="${TMP_DIR}/${route_id}.body"

  STATUS="$(
    request \
      "${route}" \
      "${HEADERS}" \
      "${BODY}"
  )"

  expect_status \
    "${STATUS}" \
    "200" \
    "Operational endpoint failed: ${route}"

  python3 \
    - "${BODY}" \
    <<'PY'
import json
import sys
from pathlib import Path

path = Path(
    sys.argv[1]
)

try:
    json.loads(
        path.read_text()
    )
except Exception as exc:
    raise SystemExit(
        f"[ERROR] Operational endpoint did not return valid JSON: {exc}"
    )
PY

  echo "[PASS] ${route} -> HTTP 200 JSON"

done


VERSION_BODY="${TMP_DIR}/_api_version.body"

python3 \
  - "${VERSION_BODY}" "${VENTURESCOPE_EXPECTED_VERSION:-}" \
  <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(
    Path(
        sys.argv[1]
    ).read_text()
)

expected_version = (
    sys.argv[2].strip()
    if len(
        sys.argv
    ) > 2
    else ""
)

if (
    payload.get(
        "service"
    )
    !=
    "venturescope"
):
    raise SystemExit(
        "[ERROR] /api/version returned unexpected service identity."
    )

version = payload.get(
    "version"
)

if not version:
    raise SystemExit(
        "[ERROR] /api/version returned an empty version."
    )

if (
    expected_version
    and
    version !=
    expected_version
):
    raise SystemExit(
        "[ERROR] Deployed version mismatch: "
        f"expected {expected_version!r}, received {version!r}."
    )

if not payload.get(
    "environment"
):
    raise SystemExit(
        "[ERROR] /api/version returned an empty environment."
    )

for forbidden in [
    "AUTH_SECRET",
    "DATABASE_URL",
    "password",
    "secret",
]:
    if forbidden in payload:
        raise SystemExit(
            f"[ERROR] /api/version exposed forbidden field: {forbidden}"
        )

print(
    "[PASS] /api/version payload is operational and non-secret"
)

if expected_version:
    print(
        f"[PASS] Expected release version is active: {expected_version}"
    )
PY


PROTECTED_HEADERS="${TMP_DIR}/protected.headers"
PROTECTED_BODY="${TMP_DIR}/protected.body"

PROTECTED_STATUS="$(
  curl \
    --silent \
    --show-error \
    --max-time 20 \
    --connect-timeout 8 \
    --dump-header "${PROTECTED_HEADERS}" \
    --output "${PROTECTED_BODY}" \
    --write-out '%{http_code}' \
    "${BASE_URL}/dashboard"
)"


case "${PROTECTED_STATUS}" in

  302|303|307|308)
    ;;

  *)
    echo "[ERROR] Anonymous /dashboard did not redirect."
    echo "HTTP=${PROTECTED_STATUS}"

    exit 1
    ;;

esac


if ! grep -Ei \
  '^location:.*\/login' \
  "${PROTECTED_HEADERS}" \
  >/dev/null
then

  echo "[ERROR] /dashboard redirect does not point to /login."

  exit 1

fi


if ! grep -Ei \
  '^x-robots-tag:.*noindex' \
  "${PROTECTED_HEADERS}" \
  >/dev/null
then

  echo "[ERROR] Protected redirect is missing X-Robots-Tag noindex."

  exit 1

fi


echo "[PASS] Anonymous dashboard access redirects safely"
echo "[PASS] Protected route advertises noindex"


PUBLIC_HEADERS="${TMP_DIR}/public-security.headers"
PUBLIC_BODY="${TMP_DIR}/public-security.body"

PUBLIC_STATUS="$(
  request \
    "/" \
    "${PUBLIC_HEADERS}" \
    "${PUBLIC_BODY}"
)"

expect_status \
  "${PUBLIC_STATUS}" \
  "200" \
  "Landing page security-header verification failed"


for header in \
  "content-security-policy" \
  "x-content-type-options" \
  "referrer-policy"
do

  if ! grep -Ei \
    "^${header}:" \
    "${PUBLIC_HEADERS}" \
    >/dev/null
  then

    echo "[ERROR] Missing required browser security header:"
    echo "  ${header}"

    exit 1

  fi

done


echo "[PASS] Browser security headers present"

echo
echo "============================================================"
echo "PRODUCTION SMOKE TEST PASSED"
echo "============================================================"
