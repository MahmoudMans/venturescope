#! /usr/bin/env bash
#
# VentureScope demo in one command: database, migrations, demo data, a check of the data, and the app.
#
#   bash scripts/demo.sh               everything, then the app at http://localhost:3000
#   bash scripts/demo.sh --no-start    everything, but do not start the app
#   bash scripts/demo.sh --no-docker   do not start the database, it already runs
#   bash scripts/demo.sh --help
#
# The demo data is written by "pnpm db:seed" and read back by "pnpm db:seed:verify".
# Run again at any time: only the three demo accounts and what they own are replaced.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT}"

START_APP=1

USE_DOCKER=1

STEP="starting"

usage() {
  printf 'Usage: bash scripts/demo.sh [--no-start] [--no-docker] [--help]\n'
  printf '\n'
  printf '  --no-start    do everything but start the app\n'
  printf '  --no-docker   do not start the database (use this when PostgreSQL already runs)\n'
  printf '  --help        show this text\n'
  printf '\n'
  printf 'To write the demo data into a database that is not on this computer, set\n'
  printf 'VS_SEED_ALLOW_REMOTE=yes. Think twice: the three demo accounts are deleted and made again.\n'
}

say() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf '\n[ERROR] %s\n' "$1" >&2

  exit 1
}

on_error() {
  printf '\n[ERROR] The demo stopped at this step: %s\n' "${STEP}" >&2
}

trap on_error ERR

for argument in "$@"; do
  case "${argument}" in
    --no-start) START_APP=0 ;;
    --no-docker) USE_DOCKER=0 ;;
    -h | --help)
      usage

      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n\n' "${argument}" >&2

      usage >&2

      exit 1
      ;;
  esac
done

# The value of a setting: the shell first, then .env.local, then .env (the order of Next.js).
read_setting() {
  local name="$1"

  local value=""

  local file=""

  local line=""

  value="$(printenv "${name}" 2>/dev/null || true)"

  if [ -z "${value}" ]; then
    for file in .env.local .env; do
      [ -f "${file}" ] || continue

      line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${name}[[:space:]]*=" "${file}" | tail -n 1 || true)"

      [ -n "${line}" ] || continue

      value="${line#*=}"

      break
    done
  fi

  value="$(printf '%s' "${value}" | sed -e 's/^[[:space:]]*//')"

  case "${value}" in
    \"*) value="$(printf '%s' "${value}" | sed -e 's/^"\([^"]*\)".*$/\1/')" ;;
    \'*) value="$(printf '%s' "${value}" | sed -e "s/^'\([^']*\)'.*\$/\1/")" ;;
    *) value="$(printf '%s' "${value}" | sed -e 's/[[:space:]]#.*$//' -e 's/[[:space:]]*$//')" ;;
  esac

  printf '%s' "${value}"
}

print_accounts() {
  printf '\nDemo accounts. All three use the password  Orbit-Demo-2026-Plan\n'
  printf '\n'
  printf '  demo@venturescope.test           Alex Morgan   founder, owns the workspace, approves requests\n'
  printf '  sam.rivera@venturescope.test     Sam Rivera    finance lead, can edit, imports the numbers\n'
  printf '  jordan.lee@venturescope.test     Jordan Lee    investor, can only read\n'
  printf '\n'
}

say "1/6 Checking the tools"

STEP="checking the tools"

command -v node >/dev/null 2>&1 || fail "Node.js is needed. Install it from https://nodejs.org and run this again."

command -v pnpm >/dev/null 2>&1 || fail "pnpm is needed. Run: corepack enable"

printf 'Node %s, pnpm %s\n' "$(node --version)" "$(pnpm --version)"

say "2/6 Checking the settings and the safety rules"

STEP="reading the settings"

DATABASE_URL_VALUE="$(read_setting DATABASE_URL)"

AUTH_SECRET_VALUE="$(read_setting AUTH_SECRET)"

if [ -z "${DATABASE_URL_VALUE}" ] || [ "${#AUTH_SECRET_VALUE}" -lt 32 ]; then
  printf '\n[ERROR] The settings are missing.\n' >&2

  printf 'Create a file named .env in the project folder with these lines:\n\n' >&2

  printf '  DATABASE_URL="postgresql://venturescope:<password>@localhost:5438/venturescope?schema=public"\n' >&2

  printf '  AUTH_SECRET="at-least-32-random-characters"\n\n' >&2

  printf 'The password is the one in docker-compose.yml. A secret can be made with: openssl rand -base64 48\n' >&2

  exit 1
fi

DATABASE_HOST="$(node -e 'try { process.stdout.write(new URL(process.argv[1]).hostname); } catch (error) { process.stdout.write("unknown"); }' "${DATABASE_URL_VALUE}")"

case "${DATABASE_HOST}" in
  localhost | 127.0.0.1 | ::1 | "[::1]" | host.docker.internal) LOCAL_DATABASE=1 ;;
  *) LOCAL_DATABASE=0 ;;
esac

if { [ "${LOCAL_DATABASE}" = "0" ] || [ "${NODE_ENV:-}" = "production" ]; } && [ "${VS_SEED_ALLOW_REMOTE:-}" != "yes" ]; then
  printf '\n[ERROR] This is not a database on your own computer (host: %s), or NODE_ENV is production.\n' "${DATABASE_HOST}" >&2

  printf 'The demo deletes and makes again the three demo accounts, so I stop here.\n' >&2

  printf 'If you are sure, run it again with VS_SEED_ALLOW_REMOTE=yes in front.\n' >&2

  exit 1
fi

printf 'Database host: %s\n' "${DATABASE_HOST}"

say "3/6 Installing the packages (only when they are missing)"

STEP="installing the packages"

if [ -x node_modules/.bin/vitest ] && [ -x node_modules/.bin/prisma ]; then
  printf 'The packages are already installed.\n'
else
  pnpm install
fi

if [ -d generated/prisma ]; then
  printf 'The Prisma client is already generated.\n'
else
  pnpm exec prisma generate
fi

say "4/6 Starting the database"

STEP="starting the database"

if [ "${LOCAL_DATABASE}" = "1" ] && [ "${USE_DOCKER}" = "1" ] && command -v docker >/dev/null 2>&1; then
  docker compose -f docker-compose.yml up -d postgres

  tries=0

  until docker compose -f docker-compose.yml exec -T postgres pg_isready -U venturescope -d venturescope >/dev/null 2>&1; do
    tries=$((tries + 1))

    if [ "${tries}" -ge 40 ]; then
      fail "The database did not start in 80 seconds. Look at: docker compose logs postgres"
    fi

    sleep 2
  done

  printf 'PostgreSQL is ready.\n'
else
  printf 'I did not start Docker. PostgreSQL must already run at %s.\n' "${DATABASE_HOST}"
fi

STEP="applying the migrations"

pnpm exec prisma migrate deploy

say "5/6 Writing the demo data"

STEP="writing the demo data"

pnpm db:seed

say "6/6 Checking the demo data"

STEP="checking the demo data"

pnpm db:seed:verify

print_accounts

if [ "${START_APP}" = "1" ]; then
  printf 'Starting the app at http://localhost:3000  (stop it with Ctrl+C)\n\n'

  STEP="starting the app"

  exec pnpm dev
fi

printf 'Everything is ready. Start the app with: pnpm dev\n'
