-- CreateTable
CREATE TABLE "ActualPeriod" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(18,2),
    "cogs" DECIMAL(18,2),
    "operatingExpenses" DECIMAL(18,2),
    "ebitda" DECIMAL(18,2),
    "netIncome" DECIMAL(18,2),
    "cashFlow" DECIMAL(18,2),
    "cashBalance" DECIMAL(18,2),
    "mrr" DECIMAL(18,2),
    "customers" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'CSV',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActualPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActualPeriod_projectId_period_idx" ON "ActualPeriod"("projectId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ActualPeriod_projectId_period_key" ON "ActualPeriod"("projectId", "period");

-- AddForeignKey
ALTER TABLE "ActualPeriod" ADD CONSTRAINT "ActualPeriod_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
