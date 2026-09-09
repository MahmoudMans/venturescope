import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  DataImportWorkbench,
} from "@/components/data-import/data-import-workbench";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";

import {
  parseDataImportStatus,
  parseDataImportType,
} from "@/lib/data-import/catalog";


export const metadata: Metadata = {
  title:
    "Data Import Center",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


function errorSummary(
  value:
    unknown,
): string |
  null {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }


  try {
    const text =
      JSON.stringify(
        value,
      );


    return text.length >
      320
      ?
        `${text.slice(
          0,
          317,
        )}...`
      :
        text;
  }
  catch {
    return "Import error details unavailable.";
  }
}


export default async function DataImportCenterPage({
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
      status?:
        string;

      message?:
        string;

      batch?:
        string;
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


  const [
    editableProject,
    batches,
    status,
  ] =
    await Promise.all([
      getProjectForEditor(
        user.id,
        projectId,
      ),

      prisma.dataImportBatch.findMany({
        where: {
          projectId,
        },

        include: {
          createdBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          100,
      }),

      searchParams,
    ]);


  const history =
    batches.map(
      (
        batch,
      ) => ({
        id:
          batch.id,

        importType:
          parseDataImportType(
            batch.importType,
          ),

        fileName:
          batch.fileName,

        status:
          parseDataImportStatus(
            batch.status,
          ),

        rowCount:
          batch.rowCount,

        insertedCount:
          batch.insertedCount,

        updatedCount:
          batch.updatedCount,

        rejectedCount:
          batch.rejectedCount,

        errorSummary:
          errorSummary(
            batch.errorSummary,
          ),

        createdBy:
          batch.createdBy?.name ??
          batch.createdBy?.email ??
          null,

        createdAt:
          batch.createdAt
            .toISOString(),

        completedAt:
          batch.completedAt
            ?.toISOString() ??
          null,
      }),
    );


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Governed data operations
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Data Import Center
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Preview, validate, and explicitly apply CSV data for Actuals, KPI Targets, and Variance Commentary while preserving project authorization, Financial Close, atomic writes, import history, and audit evidence.
        </p>
      </header>

      {
        status.status
          ?
            (
              <div
                role={
                  status.status ===
                    "error"
                    ?
                      "alert"
                    :
                      "status"
                }
                className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
              >
                {
                  status.status ===
                    "imported"
                    ?
                      `Import completed successfully${status.batch ? ` · Batch ${status.batch}` : ""}.`
                    :
                      status.message ??
                      "Data import failed."
                }
              </div>
            )
          :
            null
      }

      <DataImportWorkbench
        projectId={
          projectId
        }
        editable={
          Boolean(
            editableProject,
          )
        }
        history={
          history
        }
      />
    </main>
  );
}
