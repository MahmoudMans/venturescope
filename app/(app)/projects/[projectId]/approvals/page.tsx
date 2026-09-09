import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ApprovalCenter,
} from "@/components/approvals/approval-center";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  isProjectWorkspaceOwner,
} from "@/lib/finance/period-close/access";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";

import {
  parseApprovalRequestStatus,
  parseApprovalRequestType,
} from "@/lib/approvals/validation";


export const metadata: Metadata = {
  title:
    "Approval Center",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


function searchValue(
  value:
    string |
    string[] |
    undefined,
): string {
  return typeof value ===
    "string"
    ?
      value.trim()
    :
      "";
}


export default async function ApprovalCenterPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;

  searchParams:
    Promise<{
      approvalStatus?:
        string |
        string[];

      requestType?:
        string |
        string[];

      q?:
        string |
        string[];

      status?:
        string |
        string[];

      message?:
        string |
        string[];
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    projectId,
  } =
    await params;


  const project =
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !project
  ) {
    notFound();
  }


  const raw =
    await searchParams;


  const statusRaw =
    searchValue(
      raw.approvalStatus,
    );


  const requestTypeRaw =
    searchValue(
      raw.requestType,
    );


  const query =
    searchValue(
      raw.q,
    )
      .slice(
        0,
        160,
      );


  const statusFilter =
    statusRaw &&
    statusRaw !==
      "ALL"
      ?
        parseApprovalRequestStatus(
          statusRaw,
        )
      :
        null;


  const requestTypeFilter =
    requestTypeRaw &&
    requestTypeRaw !==
      "ALL"
      ?
        parseApprovalRequestType(
          requestTypeRaw,
        )
      :
        null;


  const where = {
    projectId,

    ...(statusFilter
      ?
        {
          status:
            statusFilter,
        }
      :
        {}),

    ...(requestTypeFilter
      ?
        {
          requestType:
            requestTypeFilter,
        }
      :
        {}),

    ...(query
      ?
        {
          OR: [
            {
              title: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },

            {
              description: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },

            {
              subjectType: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },

            {
              subjectId: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },
          ],
        }
      :
        {}),
  };


  const [
    editorProject,
    owner,
    storedRequests,
    total,
    pending,
    approved,
    rejected,
    cancelled,
  ] =
    await Promise.all([
      getProjectForEditor(
        user.id,
        projectId,
      ),

      isProjectWorkspaceOwner(
        user.id,
        projectId,
      ),

      prisma.approvalRequest.findMany({
        where,

        include: {
          requestedBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },

          decidedBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },
        },

        orderBy: {
          requestedAt:
            "desc",
        },

        take:
          250,
      }),

      prisma.approvalRequest.count({
        where: {
          projectId,
        },
      }),

      prisma.approvalRequest.count({
        where: {
          projectId,

          status:
            "PENDING",
        },
      }),

      prisma.approvalRequest.count({
        where: {
          projectId,

          status:
            "APPROVED",
        },
      }),

      prisma.approvalRequest.count({
        where: {
          projectId,

          status:
            "REJECTED",
        },
      }),

      prisma.approvalRequest.count({
        where: {
          projectId,

          status:
            "CANCELLED",
        },
      }),
    ]);


  const requests =
    storedRequests.map(
      (
        request,
      ) => ({
        id:
          request.id,

        projectId:
          request.projectId,

        requestType:
          parseApprovalRequestType(
            request.requestType,
          ),

        subjectType:
          request.subjectType,

        subjectId:
          request.subjectId,

        title:
          request.title,

        description:
          request.description,

        status:
          parseApprovalRequestStatus(
            request.status,
          ),

        requestedByUserId:
          request.requestedByUserId,

        requesterLabel:
          request.requestedBy?.name ??
          request.requestedBy?.email ??
          null,

        requestedAt:
          request.requestedAt
            .toISOString(),

        decidedByUserId:
          request.decidedByUserId,

        deciderLabel:
          request.decidedBy?.name ??
          request.decidedBy?.email ??
          null,

        decidedAt:
          request.decidedAt
            ?.toISOString() ??
          null,

        decisionNote:
          request.decisionNote,

        cancelledAt:
          request.cancelledAt
            ?.toISOString() ??
          null,
      }),
    );


  const operationStatus =
    searchValue(
      raw.status,
    );


  const operationMessage =
    searchValue(
      raw.message,
    );


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Governance &amp; authorization
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Approval Center
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Submit material management decisions for formal authorization, preserve requester-versus-approver separation, document decision rationale, and retain an auditable approval history.
        </p>
      </header>

      {
        operationStatus
          ?
            (
              <div
                role={
                  operationStatus ===
                    "error"
                    ?
                      "alert"
                    :
                      "status"
                }
                className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
              >
                {
                  operationStatus ===
                    "requested"
                    ?
                      "Approval request submitted successfully."
                    :
                  operationStatus ===
                    "decided"
                    ?
                      "Approval decision recorded successfully."
                    :
                  operationStatus ===
                    "cancelled"
                    ?
                      "Approval request cancelled successfully."
                    :
                      operationMessage ||
                      "Approval workflow operation failed."
                }
              </div>
            )
          :
            null
      }

      <ApprovalCenter
        projectId={
          projectId
        }
        currentUserId={
          user.id
        }
        canRequest={
          Boolean(
            editorProject,
          )
        }
        canDecide={
          owner
        }
        summary={{
          total,

          pending,

          approved,

          rejected,

          cancelled,
        }}
        requests={
          requests
        }
        filters={{
          status:
            statusFilter ??
            "ALL",

          requestType:
            requestTypeFilter ??
            "ALL",

          query,
        }}
      />
    </main>
  );
}
