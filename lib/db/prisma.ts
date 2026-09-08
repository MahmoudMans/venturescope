import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  PrismaClient,
} from "@/generated/prisma/client";
import {
  getServerEnvironment,
} from "@/lib/env/server";

const globalForPrisma =
  globalThis as unknown as {
    venturescopePrisma?:
      PrismaClient;
  };

function createPrismaClient() {
  const environment =
    getServerEnvironment();

  const adapter =
    new PrismaPg({
      connectionString:
        environment.DATABASE_URL,
    });

  return new PrismaClient({
    adapter,
  });
}

export const prisma =
  globalForPrisma
    .venturescopePrisma ??
  createPrismaClient();

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForPrisma.venturescopePrisma =
    prisma;
}
