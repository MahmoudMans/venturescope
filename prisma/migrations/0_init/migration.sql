-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RevenueMode" AS ENUM ('DIRECT', 'CUSTOMER_DRIVEN');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('BASE', 'BULL', 'BEAR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FinancingType" AS ENUM ('EQUITY', 'DEBT', 'GRANT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "startMonth" DATE NOT NULL,
    "horizonMonths" INTEGER NOT NULL DEFAULT 36,
    "revenueMode" "RevenueMode" NOT NULL DEFAULT 'CUSTOMER_DRIVEN',
    "baseAssumptions" JSONB NOT NULL DEFAULT '{}',
    "modelVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ScenarioType" NOT NULL,
    "modifiers" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancingType" NOT NULL,
    "month" DATE NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "apr" DECIMAL(9,6),
    "termMonths" INTEGER,
    "repaymentStartMonth" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "FinancingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyOverride" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scenarioId" TEXT,
    "month" DATE NOT NULL,
    "values" JSONB NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MonthlyOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Scenario_projectId_idx" ON "Scenario"("projectId");

-- CreateIndex
CREATE INDEX "Scenario_projectId_type_idx" ON "Scenario"("projectId", "type");

-- CreateIndex
CREATE INDEX "FinancingEvent_projectId_idx" ON "FinancingEvent"("projectId");

-- CreateIndex
CREATE INDEX "FinancingEvent_projectId_month_idx" ON "FinancingEvent"("projectId", "month");

-- CreateIndex
CREATE INDEX "MonthlyOverride_projectId_idx" ON "MonthlyOverride"("projectId");

-- CreateIndex
CREATE INDEX "MonthlyOverride_scenarioId_idx" ON "MonthlyOverride"("scenarioId");

-- CreateIndex
CREATE INDEX "MonthlyOverride_projectId_month_idx" ON "MonthlyOverride"("projectId", "month");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingEvent" ADD CONSTRAINT "FinancingEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyOverride" ADD CONSTRAINT "MonthlyOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyOverride" ADD CONSTRAINT "MonthlyOverride_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
