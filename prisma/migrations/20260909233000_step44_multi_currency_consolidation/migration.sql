-- CreateTable
CREATE TABLE "WorkspaceConsolidationSettings" (
    "workspaceId" TEXT NOT NULL,
    "reportingCurrency" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceConsolidationSettings_pkey" PRIMARY KEY ("workspaceId")
);

-- CreateTable
CREATE TABLE "WorkspaceFxRate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceFxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceConsolidationSettings_reportingCurrency_idx" ON "WorkspaceConsolidationSettings"("reportingCurrency");

-- CreateIndex
CREATE INDEX "WorkspaceFxRate_workspaceId_effectiveDate_idx" ON "WorkspaceFxRate"("workspaceId", "effectiveDate");

-- CreateIndex
CREATE INDEX "WorkspaceFxRate_workspaceId_baseCurrency_quoteCurrency_effe_idx" ON "WorkspaceFxRate"("workspaceId", "baseCurrency", "quoteCurrency", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceFxRate_workspaceId_baseCurrency_quoteCurrency_effe_key" ON "WorkspaceFxRate"("workspaceId", "baseCurrency", "quoteCurrency", "effectiveDate");

-- AddForeignKey
ALTER TABLE "WorkspaceConsolidationSettings" ADD CONSTRAINT "WorkspaceConsolidationSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceConsolidationSettings" ADD CONSTRAINT "WorkspaceConsolidationSettings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceConsolidationSettings" ADD CONSTRAINT "WorkspaceConsolidationSettings_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceFxRate" ADD CONSTRAINT "WorkspaceFxRate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceFxRate" ADD CONSTRAINT "WorkspaceFxRate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
