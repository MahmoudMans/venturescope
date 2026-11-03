"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  applyDataImportAction,
} from "@/app/(app)/projects/[projectId]/imports/actions";

import {
  PendingButton,
} from "@/components/forms/pending-button";

import {
  ImportHistoryList,
} from "@/components/data-import/import-history-list";

import {
  ImportIssueList,
} from "@/components/data-import/import-issue-list";

import {
  ImportPreview,
} from "@/components/data-import/import-preview";

import {
  DATA_IMPORT_MAX_BYTES,
  DATA_IMPORT_TEMPLATE,
} from "@/lib/data-import/catalog";

import {
  decodeCsvBytes,
} from "@/lib/data-import/decode";

import {
  type CsvDelimiter,
  describeDelimiter,
} from "@/lib/data-import/delimiter";

import {
  describeColumns,
} from "@/lib/data-import/headers";

import {
  describeLayout,
  type TableLayout,
} from "@/lib/data-import/table";

import {
  validateDataImportCsv,
} from "@/lib/data-import/validation";

import {
  describeValues,
} from "@/lib/data-import/values";

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


function ImportFormatNote({
  delimiter,
}: {
  delimiter:
    CsvDelimiter;
}) {
  const note =
    describeDelimiter(
      delimiter,
    );


  if (
    note ===
    null
  ) {
    return null;
  }


  return (
    <p
      data-slot="import-format-note"
      className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
    >
      {
        note
      }
    </p>
  );
}


function ImportLayoutNote({
  layout,
}: {
  layout:
    TableLayout;
}) {
  const note =
    describeLayout(
      layout,
    );


  if (
    note ===
    null
  ) {
    return null;
  }


  return (
    <p
      data-slot="import-layout-note"
      className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
    >
      {
        note
      }
    </p>
  );
}


function ImportColumnsNote({
  renamed,
  ignored,
}: {
  renamed:
    {
      title:
        string;

      field:
        string;
    }[];

  ignored:
    string[];
}) {
  const note =
    describeColumns(
      renamed,
      ignored,
    );


  if (
    note ===
    null
  ) {
    return null;
  }


  return (
    <p
      data-slot="import-columns-note"
      className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
    >
      {
        note
      }
    </p>
  );
}


function ImportValuesNote({
  values,
}: {
  values:
    {
      field:
        string;

      text:
        string;

      code:
        string;
    }[];
}) {
  const note =
    describeValues(
      values,
    );


  if (
    note ===
    null
  ) {
    return null;
  }


  return (
    <p
      data-slot="import-values-note"
      className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
    >
      {
        note
      }
    </p>
  );
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
                    className="touch-target rounded-lg border px-3 py-2 text-sm font-medium"
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
                      accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                      aria-describedby="import-file-hint"
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
                          decodeCsvBytes(
                            new Uint8Array(
                              await file.arrayBuffer(),
                            ),
                          );


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

                <p
                  id="import-file-hint"
                  className="mt-2 text-xs text-muted-foreground"
                >
                  A file saved by Excel is read too: with commas, semicolons or tabs, a decimal comma (1250,50), and accents. Column titles can be English or French, like Month or Mois, Revenue or CA. Capital letters and spaces do not matter. In KPI and variance files the codes can be written as names too, like Revenue, Marge EBITDA, Volume or Suivi. Lines above the column titles and empty columns are fine too. In an Actuals file, a dash or n/a means no number.
                </p>

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
                                    "text-success"
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
                                    "text-success"
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

                          <ImportFormatNote
                            delimiter={
                              validation.result
                                .delimiter
                            }
                          />

                          <ImportLayoutNote
                            layout={
                              validation.result
                                .layout
                            }
                          />

                          <ImportColumnsNote
                            renamed={
                              validation.result
                                .renamedColumns
                            }
                            ignored={
                              validation.result
                                .ignoredColumns
                            }
                          />

                          <ImportValuesNote
                            values={
                              validation.result
                                .readValues
                            }
                          />

                          {
                            validation.result
                              .issues
                              .length >
                            0
                              ?
                                (
                                  <ImportIssueList
                                    issues={
                                      validation.result
                                        .issues
                                    }
                                  />
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

                            <ImportPreview
                              headers={
                                validation.result
                                  .headers
                              }
                              rows={
                                validation.result
                                  .preview
                              }
                            />
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

                            <PendingButton
                              disabled={
                                !valid
                              }
                              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Apply validated import
                            </PendingButton>
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
                <ImportHistoryList
                  history={
                    history
                  }
                />
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
