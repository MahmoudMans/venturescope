FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app


FROM base AS deps

ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"

COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile


FROM base AS builder

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated

COPY . .

RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    AUTH_SECRET="venturescope-build-only-secret-value-000000000000" \
    AUTH_URL="http://localhost:3000" \
    TRUST_PROXY_HEADERS="false" \
    APP_VERSION="docker-build" \
    pnpm build


FROM base AS migrator

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]


FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN groupadd \
      --system \
      --gid 1001 \
      nodejs \
    && useradd \
      --system \
      --uid 1001 \
      --gid nodejs \
      nextjs

COPY --from=builder \
  --chown=nextjs:nodejs \
  /app/public \
  ./public

COPY --from=builder \
  --chown=nextjs:nodejs \
  /app/.next/standalone \
  ./

COPY --from=builder \
  --chown=nextjs:nodejs \
  /app/.next/static \
  ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
