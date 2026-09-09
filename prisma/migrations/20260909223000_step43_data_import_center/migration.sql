-- CreateTable
CREATE TABLE "DataImportBatch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "insertedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DataImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataImportBatch_projectId_createdAt_idx" ON "DataImportBatch"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "DataImportBatch_projectId_importType_createdAt_idx" ON "DataImportBatch"("projectId", "importType", "createdAt");

-- CreateIndex
CREATE INDEX "DataImportBatch_projectId_status_createdAt_idx" ON "DataImportBatch"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DataImportBatch_createdByUserId_createdAt_idx" ON "DataImportBatch"("createdByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "DataImportBatch" ADD CONSTRAINT "DataImportBatch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataImportBatch" ADD CONSTRAINT "DataImportBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
