-- CreateTable
CREATE TABLE "ProjectAlertReceipt" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAlertReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectAlertReceipt_userId_projectId_updatedAt_idx" ON "ProjectAlertReceipt"("userId", "projectId", "updatedAt");

-- CreateIndex
CREATE INDEX "ProjectAlertReceipt_projectId_alertKey_idx" ON "ProjectAlertReceipt"("projectId", "alertKey");

-- CreateIndex
CREATE INDEX "ProjectAlertReceipt_userId_snoozedUntil_idx" ON "ProjectAlertReceipt"("userId", "snoozedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAlertReceipt_userId_projectId_alertKey_key" ON "ProjectAlertReceipt"("userId", "projectId", "alertKey");

-- AddForeignKey
ALTER TABLE "ProjectAlertReceipt" ADD CONSTRAINT "ProjectAlertReceipt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAlertReceipt" ADD CONSTRAINT "ProjectAlertReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
