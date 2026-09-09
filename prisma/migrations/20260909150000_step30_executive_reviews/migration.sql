-- CreateTable
CREATE TABLE "ExecutiveReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "commentary" TEXT,
    "modelVersion" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutiveReview_projectId_periodKey_createdAt_idx" ON "ExecutiveReview"("projectId", "periodKey", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutiveReview_projectId_createdAt_idx" ON "ExecutiveReview"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutiveReview_createdByUserId_idx" ON "ExecutiveReview"("createdByUserId");

-- AddForeignKey
ALTER TABLE "ExecutiveReview" ADD CONSTRAINT "ExecutiveReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveReview" ADD CONSTRAINT "ExecutiveReview_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
