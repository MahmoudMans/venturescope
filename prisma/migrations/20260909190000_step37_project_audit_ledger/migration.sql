-- CreateTable
CREATE TABLE "ProjectAuditEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "actorUserId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectAuditEvent_projectId_createdAt_idx" ON "ProjectAuditEvent"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectAuditEvent_projectId_category_createdAt_idx" ON "ProjectAuditEvent"("projectId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectAuditEvent_projectId_action_createdAt_idx" ON "ProjectAuditEvent"("projectId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectAuditEvent_projectId_severity_createdAt_idx" ON "ProjectAuditEvent"("projectId", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectAuditEvent_actorUserId_createdAt_idx" ON "ProjectAuditEvent"("actorUserId", "createdAt");

-- VentureScope Step 37:
-- Audit events are append-only. They intentionally do not have a foreign key
-- to Project so project deletion cannot cascade-delete historical governance
-- evidence.

CREATE OR REPLACE FUNCTION venturescope_assert_project_audit_event_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'ProjectAuditEvent is append-only. % operations are prohibited.',
    TG_OP
    USING ERRCODE = '55000';
END;
$$;


CREATE TRIGGER "ProjectAuditEvent_immutable_guard"
BEFORE UPDATE OR DELETE
ON "ProjectAuditEvent"
FOR EACH ROW
EXECUTE FUNCTION venturescope_assert_project_audit_event_immutable();


-- Historical backfill from persistent governance records that already existed
-- before the generic Step 37 ledger.

INSERT INTO "ProjectAuditEvent" (
  "id",
  "projectId",
  "category",
  "action",
  "severity",
  "actorUserId",
  "entityType",
  "entityId",
  "summary",
  "metadata",
  "createdAt"
)
SELECT
  'backfill:decision-action:' || action."id",
  action."projectId",
  'DECISION_CENTER',
  'DECISION_ACTION_CREATED',
  CASE
    WHEN action."priority" = 'CRITICAL' THEN 'CRITICAL'
    WHEN action."priority" = 'HIGH' THEN 'WARNING'
    ELSE 'INFO'
  END,
  action."createdByUserId",
  'DecisionAction',
  action."id",
  'Management action created: ' || action."title",
  jsonb_build_object(
    'priority',
    action."priority",
    'status',
    action."status",
    'backfilled',
    true
  ),
  action."createdAt"
FROM "DecisionAction" action;


INSERT INTO "ProjectAuditEvent" (
  "id",
  "projectId",
  "category",
  "action",
  "severity",
  "actorUserId",
  "entityType",
  "entityId",
  "summary",
  "metadata",
  "createdAt"
)
SELECT
  'backfill:executive-review:' || review."id",
  review."projectId",
  'BOARD_ROOM',
  'EXECUTIVE_REVIEW_FROZEN',
  'INFO',
  review."createdByUserId",
  'ExecutiveReview',
  review."id",
  'Executive review frozen: ' || review."title",
  jsonb_build_object(
    'periodKey',
    review."periodKey",
    'modelVersion',
    review."modelVersion",
    'backfilled',
    true
  ),
  review."createdAt"
FROM "ExecutiveReview" review;


INSERT INTO "ProjectAuditEvent" (
  "id",
  "projectId",
  "category",
  "action",
  "severity",
  "actorUserId",
  "entityType",
  "entityId",
  "summary",
  "metadata",
  "createdAt"
)
SELECT
  'backfill:kpi-target:' || target."id",
  target."projectId",
  'SCORECARD',
  'KPI_TARGET_SAVED',
  'INFO',
  target."createdByUserId",
  'ProjectKpiTarget',
  target."id",
  'KPI target recorded for ' || target."metricCode" || ' in ' || target."periodKey",
  jsonb_build_object(
    'metricCode',
    target."metricCode",
    'periodKey',
    target."periodKey",
    'targetValue',
    target."targetValue"::text,
    'backfilled',
    true
  ),
  target."createdAt"
FROM "ProjectKpiTarget" target;


INSERT INTO "ProjectAuditEvent" (
  "id",
  "projectId",
  "category",
  "action",
  "severity",
  "actorUserId",
  "entityType",
  "entityId",
  "summary",
  "metadata",
  "createdAt"
)
SELECT
  'backfill:variance-commentary:' || commentary."id",
  commentary."projectId",
  'VARIANCE_REVIEW',
  'VARIANCE_COMMENTARY_SAVED',
  CASE
    WHEN commentary."status" = 'OPEN' THEN 'WARNING'
    ELSE 'INFO'
  END,
  commentary."createdByUserId",
  'VarianceCommentary',
  commentary."id",
  'Variance commentary recorded for ' || commentary."metricCode" || ' in ' || commentary."periodKey",
  jsonb_build_object(
    'metricCode',
    commentary."metricCode",
    'periodKey',
    commentary."periodKey",
    'causeCode',
    commentary."causeCode",
    'status',
    commentary."status",
    'backfilled',
    true
  ),
  commentary."createdAt"
FROM "VarianceCommentary" commentary;


INSERT INTO "ProjectAuditEvent" (
  "id",
  "projectId",
  "category",
  "action",
  "severity",
  "actorUserId",
  "entityType",
  "entityId",
  "summary",
  "metadata",
  "createdAt"
)
SELECT
  'backfill:period-event:' || event."id",
  event."projectId",
  'FINANCIAL_CLOSE',
  CASE
    WHEN event."action" = 'CLOSED'
      THEN 'FINANCIAL_PERIOD_CLOSED'
    ELSE 'FINANCIAL_PERIOD_REOPENED'
  END,
  CASE
    WHEN event."action" = 'REOPENED'
      THEN 'WARNING'
    ELSE 'INFO'
  END,
  event."actorUserId",
  'FinancialPeriodEvent',
  event."id",
  CASE
    WHEN event."action" = 'CLOSED'
      THEN 'Financial period closed'
    ELSE 'Financial period reopened'
  END,
  jsonb_build_object(
    'period',
    to_char(event."period", 'YYYY-MM'),
    'sequence',
    event."sequence",
    'reason',
    event."reason",
    'backfilled',
    true
  ),
  event."createdAt"
FROM "FinancialPeriodEvent" event;
