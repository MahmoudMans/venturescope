-- CreateTable
CREATE TABLE "ProjectRiskPolicy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "minimumCash" DECIMAL(18,2),
    "minimumRunwayMonths" INTEGER NOT NULL DEFAULT 6,
    "minimumEbitdaMargin" DECIMAL(8,4),
    "maximumMonthlyBurn" DECIMAL(18,2),
    "downsideRevenueShock" DECIMAL(8,4) NOT NULL DEFAULT 0.20,
    "downsideCostInflation" DECIMAL(8,4) NOT NULL DEFAULT 0.10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRiskPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRiskPolicy_projectId_key" ON "ProjectRiskPolicy"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectRiskPolicy" ADD CONSTRAINT "ProjectRiskPolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
