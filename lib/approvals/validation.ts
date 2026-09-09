import {
  APPROVAL_DECISIONS,
  APPROVAL_REQUEST_STATUSES,
  APPROVAL_REQUEST_TYPES,
  type ApprovalDecision,
  type ApprovalRequestStatus,
  type ApprovalRequestType,
} from "@/lib/approvals/types";


export function parseApprovalRequestType(
  value:
    string,
): ApprovalRequestType {
  if (
    APPROVAL_REQUEST_TYPES.includes(
      value as
        ApprovalRequestType,
    )
  ) {
    return value as
      ApprovalRequestType;
  }


  throw new Error(
    "Invalid approval request type.",
  );
}


export function parseApprovalRequestStatus(
  value:
    string,
): ApprovalRequestStatus {
  if (
    APPROVAL_REQUEST_STATUSES.includes(
      value as
        ApprovalRequestStatus,
    )
  ) {
    return value as
      ApprovalRequestStatus;
  }


  throw new Error(
    "Invalid approval request status.",
  );
}


export function parseApprovalDecision(
  value:
    string,
): ApprovalDecision {
  if (
    APPROVAL_DECISIONS.includes(
      value as
        ApprovalDecision,
    )
  ) {
    return value as
      ApprovalDecision;
  }


  throw new Error(
    "Invalid approval decision.",
  );
}


export function approvalStatusFromDecision(
  decision:
    ApprovalDecision,
): Extract<
  ApprovalRequestStatus,
  "APPROVED" |
  "REJECTED"
> {
  return decision ===
    "APPROVE"
    ?
      "APPROVED"
    :
      "REJECTED";
}


export function assertApprovalPending(
  status:
    ApprovalRequestStatus,
) {
  if (
    status !==
    "PENDING"
  ) {
    throw new Error(
      "Only pending approval requests may transition.",
    );
  }
}


export function parseApprovalSubjectValue(
  value:
    string,
  label:
    string,
): string |
  null {
  const normalized =
    value.trim();


  if (
    !normalized
  ) {
    return null;
  }


  if (
    normalized.length >
    120
  ) {
    throw new Error(
      `${label} cannot exceed 120 characters.`,
    );
  }


  if (
    !/^[A-Za-z0-9:_\-. /]+$/u.test(
      normalized,
    )
  ) {
    throw new Error(
      `${label} contains unsupported characters.`,
    );
  }


  return normalized;
}
