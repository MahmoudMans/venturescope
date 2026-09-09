-- CreateTable
CREATE TABLE "DecisionAction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "sourceCode" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ownerName" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionAction_projectId_status_dueDate_idx" ON "DecisionAction"("projectId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "DecisionAction_createdByUserId_idx" ON "DecisionAction"("createdByUserId");

-- AddForeignKey
ALTER TABLE "DecisionAction" ADD CONSTRAINT "DecisionAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionAction" ADD CONSTRAINT "DecisionAction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
