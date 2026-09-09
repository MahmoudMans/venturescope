-- CreateTable
CREATE TABLE "VarianceCommentary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "causeCode" TEXT NOT NULL,
    "varianceNature" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "explanation" TEXT NOT NULL,
    "correctiveAction" TEXT,
    "ownerName" TEXT,
    "recoveryPeriodKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VarianceCommentary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VarianceCommentary_projectId_periodKey_idx" ON "VarianceCommentary"("projectId", "periodKey");

-- CreateIndex
CREATE INDEX "VarianceCommentary_projectId_status_idx" ON "VarianceCommentary"("projectId", "status");

-- CreateIndex
CREATE INDEX "VarianceCommentary_createdByUserId_idx" ON "VarianceCommentary"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "VarianceCommentary_projectId_periodKey_metricCode_key" ON "VarianceCommentary"("projectId", "periodKey", "metricCode");

-- AddForeignKey
ALTER TABLE "VarianceCommentary" ADD CONSTRAINT "VarianceCommentary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianceCommentary" ADD CONSTRAINT "VarianceCommentary_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
