"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  applyDataImportAction,
} from "@/app/(app)/projects/[projectId]/imports/actions";

import {
  DATA_IMPORT_MAX_BYTES,
  DATA_IMPORT_TEMPLATE,
} from "@/lib/data-import/catalog";

import {
  validateDataImportCsv,
} from "@/lib/data-import/validation";

import type {
  DataImportBatchView,
  DataImportType,
} from "@/lib/data-import/types";


type Props = {
  projectId:
    string;

  editable:
    boolean;

  history:
    DataImportBatchView[];
};


function typeLabel(
  type:
    DataImportType,
): string {
  switch (
    type
  ) {
    case "ACTUALS":
      return "Actuals";

    case "KPI_TARGETS":
      return "KPI Targets";

    case "VARIANCE_COMMENTARY":
      return "Variance Commentary";
  }
}


function statusTone(
  status:
    string,
): string {
  switch (
    status
  ) {
    case "SUCCEEDED":
      return "text-emerald-700 dark:text-emerald-400";

    case "FAILED":
      return "text-destructive";

    default:
      return "text-amber-700 dark:text-amber-400";
  }
}


function downloadTemplate(
  importType:
    DataImportType,
) {
  const blob =
    new Blob(
      [
        DATA_IMPORT_TEMPLATE[
          importType
        ],
      ],
      {
        type:
          "text/csv;charset=utf-8",
      },
    );


  const url =
    URL.createObjectURL(
      blob,
    );


  const anchor =
    document.createElement(
      "a",
    );


  anchor.href =
    url;

  anchor.download =
    `venturescope-${importType.toLowerCase().replaceAll(
      "_",
      "-",
    )}-template.csv`;


  document.body.appendChild(
    anchor,
  );


  anchor.click();

  anchor.remove();


  URL.revokeObjectURL(
    url,
  );
}


export function DataImportWorkbench({
  projectId,
  editable,
  history,
}: Props) {
  const [
    importType,
    setImportType,
  ] =
    useState<
      DataImportType
    >(
      "ACTUALS",
    );


  const [
    csv,
    setCsv,
  ] =
    useState(
      "",
    );


  const [
    fileName,
    setFileName,
  ] =
    useState(
      "",
    );


  const [
    fileError,
    setFileError,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  const validation =
    useMemo(
      () => {
        if (
          !csv.trim()
        ) {
          return null;
        }


        try {
          return {
            result:
              validateDataImportCsv({
                importType,

                csv,
              }),

            error:
              null,
          };
        }
        catch (
          cause
        ) {
          return {
            result:
              null,

            error:
              cause instanceof Error
                ?
                  cause.message
                :
                  "CSV validation failed.",
          };
        }
      },
      [
        csv,
        importType,
      ],
    );


  const valid =
    Boolean(
      validation
        ?.result &&
      validation.result.issues
        .length ===
        0 &&
      validation.result.rowCount >
        0,
    );


  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-background p-5">
        <h2 className="text-lg font-semibold">
          Import governance
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Data Import Center uses a preview → validation → explicit apply workflow. Imports are atomic: if any application-stage row fails, the business-data transaction rolls back. Actuals also remain protected by the Financial Close database trigger, so a CSV cannot silently overwrite a CLOSED month.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">
              Viewer
            </p>

            <p className="mt-2 text-sm font-semibold">
              Read import history
            </p>
          </article>

          <article className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">
              Editor
            </p>

            <p className="mt-2 text-sm font-semibold">
              Preview + validate + apply
            </p>
          </article>

          <article className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">
              Owner
            </p>

            <p className="mt-2 text-sm font-semibold">
              Preview + validate + apply
            </p>
          </article>
        </div>
      </section>

      {
        editable
          ?
            (
              <section className="rounded-xl border bg-background p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Governed CSV import
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      Preview and validate
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      downloadTemplate(
                        importType,
                      );
                    }}
                    className="rounded-lg border px-3 py-2 text-sm font-medium"
                  >
                    Download sample CSV
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Import type
                    </span>

                    <select
                      value={
                        importType
                      }
                      onChange={(
                        event,
                      ) => {
                        setImportType(
                          event.target.value as
                            DataImportType,
                        );

                        setFileError(
                          null,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="ACTUALS">
                        Actuals
                      </option>

                      <option value="KPI_TARGETS">
                        KPI Targets
                      </option>

                      <option value="VARIANCE_COMMENTARY">
                        Variance Commentary
                      </option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      CSV file
                    </span>

                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="block w-full rounded-lg border p-2 text-sm"
                      onChange={async (
                        event,
                      ) => {
                        const file =
                          event.target.files?.[
                            0
                          ];


                        if (
                          !file
                        ) {
                          return;
                        }


                        if (
                          file.size >
                          DATA_IMPORT_MAX_BYTES
                        ) {
                          setCsv(
                            "",
                          );

                          setFileName(
                            "",
                          );

                          setFileError(
                            "CSV cannot exceed 512KB.",
                          );

                          return;
                        }


                        const text =
                          await file.text();


                        setCsv(
                          text,
                        );

                        setFileName(
                          file.name,
                        );

                        setFileError(
                          null,
                        );
                      }}
                    />
                  </label>
                </div>

                {
                  fileError
                    ?
                      (
                        <div
                          role="alert"
                          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                        >
                          {
                            fileError
                          }
                        </div>
                      )
                    :
                      null
                }

                {
                  validation?.error
                    ?
                      (
                        <div
                          role="alert"
                          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                        >
                          {
                            validation.error
                          }
                        </div>
                      )
                    :
                      null
                }

                {
                  validation?.result
                    ?
                      (
                        <div className="mt-6 space-y-5">
                          <section className="grid gap-3 sm:grid-cols-3">
                            <article className="rounded-lg border p-4">
                              <p className="text-xs text-muted-foreground">
                                Rows
                              </p>

                              <p className="mt-1 text-2xl font-semibold">
                                {
                                  validation.result
                                    .rowCount
                                }
                              </p>
                            </article>

                            <article className="rounded-lg border p-4">
                              <p className="text-xs text-muted-foreground">
                                Validation issues
                              </p>

                              <p className={`mt-1 text-2xl font-semibold ${
                                validation.result
                                  .issues
                                  .length >
                                0
                                  ?
                                    "text-destructive"
                                  :
                                    "text-emerald-700 dark:text-emerald-400"
                              }`}>
                                {
                                  validation.result
                                    .issues
                                    .length
                                }
                              </p>
                            </article>

                            <article className="rounded-lg border p-4">
                              <p className="text-xs text-muted-foreground">
                                Status
                              </p>

                              <p className={`mt-1 text-sm font-semibold ${
                                valid
                                  ?
                                    "text-emerald-700 dark:text-emerald-400"
                                  :
                                    "text-destructive"
                              }`}>
                                {
                                  valid
                                    ?
                                      "READY TO APPLY"
                                    :
                                      "NOT READY"
                                }
                              </p>
                            </article>
                          </section>

                          {
                            validation.result
                              .issues
                              .length >
                            0
                              ?
                                (
                                  <section className="rounded-lg border">
                                    <div className="border-b p-4">
                                      <h3 className="font-semibold">
                                        Validation issues
                                      </h3>
                                    </div>

                                    <div className="max-h-72 overflow-auto">
                                      <table className="w-full min-w-[650px] text-sm">
                                        <thead>
                                          <tr className="border-b bg-muted/30">
                                            <th className="px-3 py-2 text-left">
                                              Row
                                            </th>

                                            <th className="px-3 py-2 text-left">
                                              Field
                                            </th>

                                            <th className="px-3 py-2 text-left">
                                              Issue
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {
                                            validation.result
                                              .issues
                                              .slice(
                                                0,
                                                50,
                                              )
                                              .map(
                                                (
                                                  issue,
                                                  index,
                                                ) => (
                                                  <tr
                                                    key={`${issue.row}:${issue.field}:${index}`}
                                                    className="border-b last:border-0"
                                                  >
                                                    <td className="px-3 py-2">
                                                      {
                                                        issue.row
                                                      }
                                                    </td>

                                                    <td className="px-3 py-2 font-mono text-xs">
                                                      {
                                                        issue.field
                                                      }
                                                    </td>

                                                    <td className="px-3 py-2 text-destructive">
                                                      {
                                                        issue.message
                                                      }
                                                    </td>
                                                  </tr>
                                                ),
                                              )
                                          }
                                        </tbody>
                                      </table>
                                    </div>
                                  </section>
                                )
                              :
                                null
                          }

                          <section className="overflow-hidden rounded-lg border">
                            <div className="border-b p-4">
                              <h3 className="font-semibold">
                                Preview
                              </h3>

                              <p className="mt-1 text-xs text-muted-foreground">
                                First eight rows only.
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[900px] text-xs">
                                <thead>
                                  <tr className="border-b bg-muted/30">
                                    {
                                      validation.result
                                        .headers
                                        .map(
                                          (
                                            header,
                                          ) => (
                                            <th
                                              key={
                                                header
                                              }
                                              className="px-3 py-2 text-left"
                                            >
                                              {
                                                header
                                              }
                                            </th>
                                          ),
                                        )
                                    }
                                  </tr>
                                </thead>

                                <tbody>
                                  {
                                    validation.result
                                      .preview
                                      .map(
                                        (
                                          row,
                                          index,
                                        ) => (
                                          <tr
                                            key={
                                              index
                                            }
                                            className="border-b last:border-0"
                                          >
                                            {
                                              validation.result
                                                .headers
                                                .map(
                                                  (
                                                    header,
                                                  ) => (
                                                    <td
                                                      key={
                                                        header
                                                      }
                                                      className="max-w-xs truncate px-3 py-2"
                                                    >
                                                      {
                                                        row[
                                                          header
                                                        ] ??
                                                        ""
                                                      }
                                                    </td>
                                                  ),
                                                )
                                            }
                                          </tr>
                                        ),
                                      )
                                  }
                                </tbody>
                              </table>
                            </div>
                          </section>

                          <form
                            action={
                              applyDataImportAction
                            }
                          >
                            <input
                              type="hidden"
                              name="projectId"
                              value={
                                projectId
                              }
                            />

                            <input
                              type="hidden"
                              name="importType"
                              value={
                                importType
                              }
                            />

                            <input
                              type="hidden"
                              name="fileName"
                              value={
                                fileName ||
                                `${importType.toLowerCase()}.csv`
                              }
                            />

                            <textarea
                              hidden
                              readOnly
                              name="csv"
                              value={
                                csv
                              }
                            />

                            <button
                              type="submit"
                              disabled={
                                !valid
                              }
                              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Apply validated import
                            </button>
                          </form>
                        </div>
                      )
                    :
                      null
                }
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Import history is available below, but applying CSV data requires Editor permission.
              </section>
            )
      }

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Import history
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            The latest 100 governed import attempts are retained for this project.
          </p>
        </div>

        {
          history.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No governed imports have been recorded yet.
                </div>
              )
            :
              (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Time
                        </th>

                        <th className="px-4 py-3 text-left">
                          Type
                        </th>

                        <th className="px-4 py-3 text-left">
                          File
                        </th>

                        <th className="px-4 py-3 text-left">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right">
                          Rows
                        </th>

                        <th className="px-4 py-3 text-right">
                          Inserted
                        </th>

                        <th className="px-4 py-3 text-right">
                          Updated
                        </th>

                        <th className="px-4 py-3 text-right">
                          Rejected
                        </th>

                        <th className="px-4 py-3 text-left">
                          User
                        </th>

                        <th className="px-4 py-3 text-left">
                          Error
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        history.map(
                          (
                            batch,
                          ) => (
                            <tr
                              key={
                                batch.id
                              }
                              className="border-b align-top last:border-0"
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-xs">
                                {
                                  new Date(
                                    batch.createdAt,
                                  ).toLocaleString()
                                }
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {
                                  typeLabel(
                                    batch.importType,
                                  )
                                }
                              </td>

                              <td className="max-w-xs truncate px-4 py-3">
                                {
                                  batch.fileName
                                }
                              </td>

                              <td className={`px-4 py-3 font-semibold ${statusTone(
                                batch.status,
                              )}`}>
                                {
                                  batch.status
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {
                                  batch.rowCount
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {
                                  batch.insertedCount
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {
                                  batch.updatedCount
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {
                                  batch.rejectedCount
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  batch.createdBy ??
                                  "Unavailable"
                                }
                              </td>

                              <td className="max-w-sm px-4 py-3 text-xs text-muted-foreground">
                                {
                                  batch.errorSummary ??
                                  "—"
                                }
                              </td>
                            </tr>
                          ),
                        )
                      }
                    </tbody>
                  </table>
                </div>
              )
        }
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Import integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Preview validation does not modify project data. Applying an import is explicit and atomic. Actuals imports remain subject to Financial Close at the PostgreSQL boundary; KPI Targets and Variance Commentary keep their existing project-scoped identities. Every completed or failed import is recorded in import history and the Project Audit Trail.
        </p>
      </section>
    </div>
  );
}
