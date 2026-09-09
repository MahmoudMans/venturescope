-- CreateTable
CREATE TABLE "ForecastBaseline" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastBaseline_projectId_createdAt_idx" ON "ForecastBaseline"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ForecastBaseline_createdByUserId_idx" ON "ForecastBaseline"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastBaseline_projectId_name_key" ON "ForecastBaseline"("projectId", "name");

-- AddForeignKey
ALTER TABLE "ForecastBaseline" ADD CONSTRAINT "ForecastBaseline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastBaseline" ADD CONSTRAINT "ForecastBaseline_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
