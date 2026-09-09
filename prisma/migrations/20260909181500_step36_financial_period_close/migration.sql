-- CreateTable
CREATE TABLE "FinancialPeriodState" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "period" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closeSequence" INTEGER NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialPeriodState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialPeriodEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "period" DATE NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialPeriodEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialPeriodState_projectId_status_idx" ON "FinancialPeriodState"("projectId", "status");

-- CreateIndex
CREATE INDEX "FinancialPeriodState_projectId_period_idx" ON "FinancialPeriodState"("projectId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriodState_projectId_period_key" ON "FinancialPeriodState"("projectId", "period");

-- CreateIndex
CREATE INDEX "FinancialPeriodEvent_projectId_period_createdAt_idx" ON "FinancialPeriodEvent"("projectId", "period", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialPeriodEvent_projectId_action_idx" ON "FinancialPeriodEvent"("projectId", "action");

-- AddForeignKey
ALTER TABLE "FinancialPeriodState" ADD CONSTRAINT "FinancialPeriodState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialPeriodEvent" ADD CONSTRAINT "FinancialPeriodEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VentureScope Step 36:
-- Financial-close enforcement belongs at the database boundary so that
-- every ActualPeriod INSERT, UPDATE, or DELETE path respects CLOSED periods,
-- including future application code that may not know about the close service.

CREATE OR REPLACE FUNCTION venturescope_assert_actual_period_open()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN

    IF EXISTS (
      SELECT 1
      FROM "FinancialPeriodState" state
      WHERE state."projectId" = NEW."projectId"
        AND state."period" = date_trunc('month', NEW."period")::date
        AND state."status" = 'CLOSED'
    ) THEN
      RAISE EXCEPTION
        'Actual period % is CLOSED for project %.',
        to_char(NEW."period", 'YYYY-MM'),
        NEW."projectId"
        USING ERRCODE = '55000';
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN

    IF EXISTS (
      SELECT 1
      FROM "FinancialPeriodState" state
      WHERE state."projectId" = OLD."projectId"
        AND state."period" = date_trunc('month', OLD."period")::date
        AND state."status" = 'CLOSED'
    ) THEN
      RAISE EXCEPTION
        'Actual period % is CLOSED for project %.',
        to_char(OLD."period", 'YYYY-MM'),
        OLD."projectId"
        USING ERRCODE = '55000';
    END IF;

    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN

    IF EXISTS (
      SELECT 1
      FROM "FinancialPeriodState" state
      WHERE state."projectId" = OLD."projectId"
        AND state."period" = date_trunc('month', OLD."period")::date
        AND state."status" = 'CLOSED'
    ) THEN
      RAISE EXCEPTION
        'Actual period % is CLOSED for project %.',
        to_char(OLD."period", 'YYYY-MM'),
        OLD."projectId"
        USING ERRCODE = '55000';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM "FinancialPeriodState" state
      WHERE state."projectId" = NEW."projectId"
        AND state."period" = date_trunc('month', NEW."period")::date
        AND state."status" = 'CLOSED'
    ) THEN
      RAISE EXCEPTION
        'Actual period % is CLOSED for project %.',
        to_char(NEW."period", 'YYYY-MM'),
        NEW."projectId"
        USING ERRCODE = '55000';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;


CREATE TRIGGER "ActualPeriod_closed_period_guard"
BEFORE INSERT OR UPDATE OR DELETE
ON "ActualPeriod"
FOR EACH ROW
EXECUTE FUNCTION venturescope_assert_actual_period_open();
