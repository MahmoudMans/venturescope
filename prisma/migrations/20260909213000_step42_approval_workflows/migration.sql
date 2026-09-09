-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalRequest_projectId_status_requestedAt_idx" ON "ApprovalRequest"("projectId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_projectId_requestType_requestedAt_idx" ON "ApprovalRequest"("projectId", "requestType", "requestedAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedByUserId_status_idx" ON "ApprovalRequest"("requestedByUserId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_decidedByUserId_decidedAt_idx" ON "ApprovalRequest"("decidedByUserId", "decidedAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_projectId_subjectType_subjectId_idx" ON "ApprovalRequest"("projectId", "subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
