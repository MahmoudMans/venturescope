#!/usr/bin/env bash

set -euo pipefail


deployment_timestamp() {
  date \
    -u \
    +%Y%m%dT%H%M%SZ
}


deployment_state_dir() {
  printf '%s\n' \
    "${VENTURESCOPE_DEPLOY_STATE_DIR:-.venturescope/deploy}"
}


validate_release_id() {
  local release_id="$1"

  if [[ -z "${release_id}" ]]; then

    echo "[ERROR] Release ID cannot be empty."

    return 1

  fi

  if [[ ! "${release_id}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$ ]]; then

    echo "[ERROR] Invalid release ID:"
    echo "  ${release_id}"
    echo
    echo "Allowed:"
    echo "  letters"
    echo "  numbers"
    echo "  dot"
    echo "  underscore"
    echo "  hyphen"

    return 1

  fi
}


acquire_deployment_lock() {
  local state_dir="$1"
  local operation="$2"

  local lock_dir="${state_dir}/deployment.lock"

  mkdir -p \
    "${state_dir}"


  if mkdir \
    "${lock_dir}" \
    2>/dev/null
  then

    printf '%s\n' \
      "$$" \
      > "${lock_dir}/pid"

    printf '%s\n' \
      "${operation}" \
      > "${lock_dir}/operation"

    printf '%s\n' \
      "$(
        deployment_timestamp
      )" \
      > "${lock_dir}/created_at"

    export VENTURESCOPE_ACTIVE_DEPLOYMENT_LOCK="${lock_dir}"

    echo "[PASS] Deployment lock acquired"

    return 0

  fi


  if [[ "${VENTURESCOPE_FORCE_UNLOCK:-NO}" == "YES" ]]; then

    echo "[WARN] Removing deployment lock because VENTURESCOPE_FORCE_UNLOCK=YES"

    rm -rf \
      "${lock_dir}"

    mkdir \
      "${lock_dir}"

    printf '%s\n' \
      "$$" \
      > "${lock_dir}/pid"

    printf '%s\n' \
      "${operation}" \
      > "${lock_dir}/operation"

    printf '%s\n' \
      "$(
        deployment_timestamp
      )" \
      > "${lock_dir}/created_at"

    export VENTURESCOPE_ACTIVE_DEPLOYMENT_LOCK="${lock_dir}"

    echo "[PASS] Deployment lock forcibly reacquired"

    return 0

  fi


  echo "[ERROR] Another deployment/rollback operation appears active."
  echo
  echo "Lock:"
  echo "  ${lock_dir}"

  if [[ -f "${lock_dir}/pid" ]]; then

    echo
    echo "PID:"
    cat \
      "${lock_dir}/pid"

  fi

  if [[ -f "${lock_dir}/operation" ]]; then

    echo
    echo "Operation:"
    cat \
      "${lock_dir}/operation"

  fi

  echo
  echo "If the lock is known to be stale, explicitly use:"
  echo "  VENTURESCOPE_FORCE_UNLOCK=YES"

  return 1
}


release_deployment_lock() {
  local lock_dir="${VENTURESCOPE_ACTIVE_DEPLOYMENT_LOCK:-}"

  if [[ -n "${lock_dir}" ]]; then

    rm -rf \
      "${lock_dir}"

    unset VENTURESCOPE_ACTIVE_DEPLOYMENT_LOCK

    echo "[PASS] Deployment lock released"

  fi
}


state_value() {
  local key="$1"
  local file="$2"

  awk \
    -F= \
    -v wanted="${key}" \
    '
      $1 == wanted {
        sub(/^[^=]*=/, "", $0)
        print
        exit
      }
    ' \
    "${file}"
}


write_release_state() {
  local file="$1"
  local release_id="$2"
  local release_image="$3"
  local previous_image="$4"
  local previous_version="$5"
  local backup_file="$6"
  local production_url="$7"
  local git_sha="$8"
  local deployed_at="$9"

  mkdir -p \
    "$(
      dirname \
        "${file}"
    )"

  {
    printf 'RELEASE_ID=%s\n' \
      "${release_id}"

    printf 'RELEASE_IMAGE=%s\n' \
      "${release_image}"

    printf 'PREVIOUS_IMAGE=%s\n' \
      "${previous_image}"

    printf 'PREVIOUS_VERSION=%s\n' \
      "${previous_version}"

    printf 'BACKUP_FILE=%s\n' \
      "${backup_file}"

    printf 'PRODUCTION_URL=%s\n' \
      "${production_url}"

    printf 'GIT_SHA=%s\n' \
      "${git_sha}"

    printf 'DEPLOYED_AT=%s\n' \
      "${deployed_at}"

  } > "${file}"
}


current_application_image() {
  local compose_file="$1"
  local app_service="$2"

  local container_id

  container_id="$(
    docker compose \
      -f "${compose_file}" \
      ps \
      -q \
      "${app_service}" \
      2>/dev/null \
      || true
  )"


  if [[ -z "${container_id}" ]]; then

    return 0

  fi


  docker inspect \
    "${container_id}" \
    --format '{{.Config.Image}}' \
    2>/dev/null \
    || true
}


current_remote_version() {
  local production_url="$1"

  curl \
    --silent \
    --show-error \
    --max-time 8 \
    --connect-timeout 4 \
    "${production_url%/}/api/version" \
    2>/dev/null \
  | python3 \
      -c '
import json
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    raise SystemExit(0)

version = payload.get(
    "version"
)

if isinstance(
    version,
    str,
):
    print(
        version
    )
' \
    2>/dev/null \
    || true
}
