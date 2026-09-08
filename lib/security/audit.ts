export type SecurityAuditAction =
  | "model.settings.update"
  | "model.assumptions.reset"
  | "model.financing.clear"
  | "model.overrides.clear"
  | "model.scenarios.reset"
  | "financing.delete"
  | "override.delete"
  | "scenario.delete";

type AuditMetadata =
  Record<
    string,
    | string
    | number
    | boolean
    | null
    | undefined
  >;

export function auditSecurityEvent({
  action,
  userId,
  projectId,
  targetId,
  metadata,
}: {
  action:
    SecurityAuditAction;

  userId: string;

  projectId: string;

  targetId?: string;

  metadata?:
    AuditMetadata;
}): void {
  const event = {
    event:
      "venturescope.audit",

    timestamp:
      new Date()
        .toISOString(),

    action,

    actorUserId:
      userId,

    projectId,

    targetId:
      targetId ??
      null,

    metadata:
      metadata ??
      {},
  };

  console.info(
    JSON.stringify(
      event,
    ),
  );
}
