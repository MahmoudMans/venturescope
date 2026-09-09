-- CreateTable
CREATE TABLE "ProjectKpiTarget" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "targetValue" DECIMAL(18,4) NOT NULL,
    "ownerName" TEXT,
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectKpiTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectKpiTarget_projectId_periodKey_idx" ON "ProjectKpiTarget"("projectId", "periodKey");

-- CreateIndex
CREATE INDEX "ProjectKpiTarget_createdByUserId_idx" ON "ProjectKpiTarget"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectKpiTarget_projectId_periodKey_metricCode_key" ON "ProjectKpiTarget"("projectId", "periodKey", "metricCode");

-- AddForeignKey
ALTER TABLE "ProjectKpiTarget" ADD CONSTRAINT "ProjectKpiTarget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectKpiTarget" ADD CONSTRAINT "ProjectKpiTarget_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
