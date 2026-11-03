import {
  describeUntitled,
  readCsvTable,
  titleRules,
} from "@/lib/data-import/table";

import {
  DATA_IMPORT_MAX_BYTES,
  DATA_IMPORT_MAX_ROWS,
} from "@/lib/data-import/catalog";

import {
  describeMissingTitles,
  describeNoNumbers,
  readColumnTitles,
} from "@/lib/data-import/headers";

import {
  describeInvalidValue,
  readRecordValues,
  type ReadValue,
} from "@/lib/data-import/values";

import {
  readRecordNumbers,
} from "@/lib/data-import/number";

import {
  readMonthColumn,
} from "@/lib/finance/actuals/month-column";

import type {
  DataImportIssue,
  DataImportType,
  DataImportValidationResult,
  NormalizedActualImportRow,
  NormalizedDataImportRow,
  NormalizedKpiImportRow,
  NormalizedVarianceImportRow,
} from "@/lib/data-import/types";

import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";

import {
  parseKpiMetricCode,
  parseKpiTargetValue,
} from "@/lib/finance/scorecard/metrics";

import {
  parseRecoveryPeriod,
  parseVarianceCauseCode,
  parseVarianceCommentaryStatus,
  parseVarianceMetricCode,
  parseVarianceNature,
  parseVariancePeriod,
} from "@/lib/finance/variance-review/metrics";


const REQUIRED_HEADERS:
  Record<
    DataImportType,
    string[]
  > = {
    ACTUALS: [
      "period",
    ],

    KPI_TARGETS: [
      "periodKey",
      "metricCode",
      "targetValue",
    ],

    VARIANCE_COMMENTARY: [
      "periodKey",
      "metricCode",
      "causeCode",
      "varianceNature",
      "explanation",
      "status",
    ],
  };


function optional(
  value:
    string,
): string |
  null {
  const normalized =
    value.trim();


  return normalized
    ?
      normalized
    :
      null;
}


function numberOrNull(
  value:
    string,
  field:
    string,
): number |
  null {
  const normalized =
    value.trim();


  if (
    !normalized
  ) {
    return null;
  }


  const parsed =
    Number(
      normalized,
    );


  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    throw new Error(
      `${field} must be a valid number.`,
    );
  }


  return parsed;
}


function customersOrNull(
  value:
    string,
): number |
  null {
  const parsed =
    numberOrNull(
      value,
      "customers",
    );


  if (
    parsed ===
    null
  ) {
    return null;
  }


  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed <
      0
  ) {
    throw new Error(
      "customers must be a non-negative whole number.",
    );
  }


  return parsed;
}


function pushIssue(
  issues:
    DataImportIssue[],
  row:
    number,
  field:
    string,
  cause:
    unknown,
) {
  issues.push({
    row,

    field,

    message:
      cause instanceof Error
        ?
          describeInvalidValue(
            cause.message,
          )
        :
          "Invalid value.",
  });
}


function validateActualRow({
  record,
  rowNumber,
  issues,
}: {
  record:
    Record<
      string,
      string
    >;

  rowNumber:
    number;

  issues:
    DataImportIssue[];
}): NormalizedActualImportRow |
  null {
  const before =
    issues.length;


  const periodKey =
    parseMonthKey(
      record.period ??
      "",
    );


  if (
    !periodKey
  ) {
    pushIssue(
      issues,
      rowNumber,
      "period",
      new Error(
        "period must be a valid month.",
      ),
    );
  }


  const readNumber = (
    field:
      string,
  ) => {
    try {
      return numberOrNull(
        record[
          field
        ] ??
        "",
        field,
      );
    }
    catch (
      cause
    ) {
      pushIssue(
        issues,
        rowNumber,
        field,
        cause,
      );

      return null;
    }
  };


  const revenue =
    readNumber(
      "revenue",
    );

  const cogs =
    readNumber(
      "cogs",
    );

  const operatingExpenses =
    readNumber(
      "operatingExpenses",
    );

  const ebitda =
    readNumber(
      "ebitda",
    );

  const netIncome =
    readNumber(
      "netIncome",
    );

  const cashFlow =
    readNumber(
      "cashFlow",
    );

  const cashBalance =
    readNumber(
      "cashBalance",
    );

  const mrr =
    readNumber(
      "mrr",
    );


  let customers:
    number |
    null =
      null;


  try {
    customers =
      customersOrNull(
        record.customers ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "customers",
      cause,
    );
  }


  if (
    issues.length !==
    before ||
    !periodKey
  ) {
    return null;
  }


  return {
    kind:
      "ACTUALS",

    rowNumber,

    periodKey,

    revenue,

    cogs,

    operatingExpenses,

    ebitda,

    netIncome,

    cashFlow,

    cashBalance,

    mrr,

    customers,
  };
}


function validateKpiRow({
  record,
  rowNumber,
  issues,
}: {
  record:
    Record<
      string,
      string
    >;

  rowNumber:
    number;

  issues:
    DataImportIssue[];
}): NormalizedKpiImportRow |
  null {
  const before =
    issues.length;


  const periodKey =
    parseMonthKey(
      record.periodKey ??
      "",
    );


  if (
    !periodKey
  ) {
    pushIssue(
      issues,
      rowNumber,
      "periodKey",
      new Error(
        "periodKey must be a valid month.",
      ),
    );
  }


  let metricCode:
    NormalizedKpiImportRow[
      "metricCode"
    ] |
    null =
      null;


  try {
    metricCode =
      parseKpiMetricCode(
        record.metricCode ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "metricCode",
      cause,
    );
  }


  let targetValue:
    number |
    null =
      null;


  if (
    metricCode
  ) {
    try {
      targetValue =
        parseKpiTargetValue(
          metricCode,
          record.targetValue ??
          "",
        );
    }
    catch (
      cause
    ) {
      pushIssue(
        issues,
        rowNumber,
        "targetValue",
        cause,
      );
    }
  }


  const ownerName =
    optional(
      record.ownerName ??
      "",
    );


  const note =
    optional(
      record.note ??
      "",
    );


  if (
    ownerName &&
    ownerName.length >
    80
  ) {
    pushIssue(
      issues,
      rowNumber,
      "ownerName",
      new Error(
        "ownerName cannot exceed 80 characters.",
      ),
    );
  }


  if (
    note &&
    note.length >
    1000
  ) {
    pushIssue(
      issues,
      rowNumber,
      "note",
      new Error(
        "note cannot exceed 1000 characters.",
      ),
    );
  }


  if (
    issues.length !==
      before ||
    !periodKey ||
    !metricCode ||
    targetValue ===
      null
  ) {
    return null;
  }


  return {
    kind:
      "KPI_TARGETS",

    rowNumber,

    periodKey,

    metricCode,

    targetValue,

    ownerName,

    note,
  };
}


function validateVarianceRow({
  record,
  rowNumber,
  issues,
}: {
  record:
    Record<
      string,
      string
    >;

  rowNumber:
    number;

  issues:
    DataImportIssue[];
}): NormalizedVarianceImportRow |
  null {
  const before =
    issues.length;


  let periodKey:
    string |
    null =
      null;


  let metricCode:
    NormalizedVarianceImportRow[
      "metricCode"
    ] |
    null =
      null;


  let causeCode:
    NormalizedVarianceImportRow[
      "causeCode"
    ] |
    null =
      null;


  let varianceNature:
    NormalizedVarianceImportRow[
      "varianceNature"
    ] |
    null =
      null;


  let status:
    NormalizedVarianceImportRow[
      "status"
    ] |
    null =
      null;


  let recoveryPeriodKey:
    string |
    null =
      null;


  try {
    periodKey =
      parseVariancePeriod(
        record.periodKey ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "periodKey",
      cause,
    );
  }


  try {
    metricCode =
      parseVarianceMetricCode(
        record.metricCode ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "metricCode",
      cause,
    );
  }


  try {
    causeCode =
      parseVarianceCauseCode(
        record.causeCode ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "causeCode",
      cause,
    );
  }


  try {
    varianceNature =
      parseVarianceNature(
        record.varianceNature ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "varianceNature",
      cause,
    );
  }


  try {
    status =
      parseVarianceCommentaryStatus(
        record.status ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "status",
      cause,
    );
  }


  try {
    recoveryPeriodKey =
      parseRecoveryPeriod(
        record.recoveryPeriodKey ??
        "",
      );
  }
  catch (
    cause
  ) {
    pushIssue(
      issues,
      rowNumber,
      "recoveryPeriodKey",
      cause,
    );
  }


  const explanation =
    (
      record.explanation ??
      ""
    ).trim();


  if (
    explanation.length <
      5 ||
    explanation.length >
      2000
  ) {
    pushIssue(
      issues,
      rowNumber,
      "explanation",
      new Error(
        "explanation must contain between 5 and 2000 characters.",
      ),
    );
  }


  const correctiveAction =
    optional(
      record.correctiveAction ??
      "",
    );


  const ownerName =
    optional(
      record.ownerName ??
      "",
    );


  if (
    correctiveAction &&
    correctiveAction.length >
    2000
  ) {
    pushIssue(
      issues,
      rowNumber,
      "correctiveAction",
      new Error(
        "correctiveAction cannot exceed 2000 characters.",
      ),
    );
  }


  if (
    ownerName &&
    ownerName.length >
    80
  ) {
    pushIssue(
      issues,
      rowNumber,
      "ownerName",
      new Error(
        "ownerName cannot exceed 80 characters.",
      ),
    );
  }


  if (
    issues.length !==
      before ||
    !periodKey ||
    !metricCode ||
    !causeCode ||
    !varianceNature ||
    !status
  ) {
    return null;
  }


  return {
    kind:
      "VARIANCE_COMMENTARY",

    rowNumber,

    periodKey,

    metricCode,

    causeCode,

    varianceNature,

    explanation,

    correctiveAction,

    ownerName,

    recoveryPeriodKey,

    status,
  };
}


export function validateDataImportCsv({
  importType,
  csv,
}: {
  importType:
    DataImportType;

  csv:
    string;
}): DataImportValidationResult {
  if (
    new TextEncoder()
      .encode(
        csv,
      )
      .byteLength >
    DATA_IMPORT_MAX_BYTES
  ) {
    throw new Error(
      "CSV cannot exceed 512KB.",
    );
  }


  const file =
    readCsvTable(
      csv,
      titleRules(
        importType,
        REQUIRED_HEADERS[
          importType
        ],
      ),
    );


  const delimiter =
    file.delimiter;


  const titles =
    readColumnTitles(
      importType,
      file.headers,
    );


  const headers =
    titles.fields;


  const records =
    file.records.map(
      (
        record,
      ) =>
        Object.fromEntries(
          file.headers.map(
            (
              title,
              index,
            ) => [
              headers[
                index
              ],
              record[
                title
              ] ??
              "",
            ],
          ),
        ),
    );


  const missing =
    REQUIRED_HEADERS[
      importType
    ].filter(
      (
        header,
      ) =>
        !headers.includes(
          header,
        ),
    );


  if (
    missing.length >
    0
  ) {
    throw new Error(
      describeMissingTitles(
        importType,
        missing,
      ),
    );
  }


  const noNumbers =
    describeNoNumbers(
      importType,
      headers,
    );


  if (
    noNumbers !==
    null
  ) {
    throw new Error(
      noNumbers,
    );
  }


  if (
    records.length >
    DATA_IMPORT_MAX_ROWS[
      importType
    ]
  ) {
    throw new Error(
      `${importType} import may contain at most ${DATA_IMPORT_MAX_ROWS[
        importType
      ]} rows.`,
    );
  }


  const issues:
    DataImportIssue[] =
      [];


  const rows:
    NormalizedDataImportRow[] =
      [];


  const readValues =
    new Map<
      string,
      ReadValue
    >();


  let emptyNumbers =
    0;


  const monthField =
    importType ===
      "ACTUALS"
      ?
        "period"
      :
        "periodKey";


  const months =
    readMonthColumn(
      records.map(
        (
          fileRecord,
        ) =>
          fileRecord[
            monthField
          ] ??
          "",
      ),
      {
        unique:
          importType ===
            "ACTUALS",

        dayFirstDefault:
          delimiter ===
            ";",
      },
    );


  if (
    months.problem
  ) {
    issues.push({
      row:
        file.rowNumbers[
          months.problem.index
        ],

      field:
        monthField,

      message:
        months.problem.message,
    });
  }


  records.forEach(
    (
      fileRecord,
      index,
    ) => {
      const rowNumber =
        file.rowNumbers[
          index
        ];


      const {
        record: numbered,
        problems,
        emptied,
      } =
        readRecordNumbers(
          importType,
          {
            ...fileRecord,

            [monthField]:
              months.cells[
                index
              ],
          },
          delimiter ===
            ";",
        );


      emptyNumbers +=
        emptied;


      const {
        record,
        read,
      } =
        readRecordValues(
          importType,
          numbered,
        );


      for (
        const item
        of read
      ) {
        readValues.set(
          `${item.field}|${item.text}`,
          item,
        );
      }


      for (
        const problem
        of problems
      ) {
        issues.push({
          row:
            rowNumber,

          field:
            problem.field,

          message:
            problem.message,
        });
      }


      const untitled =
        file.untitled[
          index
        ];


      if (
        untitled >
        0
      ) {
        issues.push({
          row:
            rowNumber,

          field:
            "no title",

          message:
            describeUntitled(
              untitled,
            ),
        });
      }


      const row =
        importType ===
          "ACTUALS"
          ?
            validateActualRow({
              record,

              rowNumber,

              issues,
            })
          :
        importType ===
          "KPI_TARGETS"
          ?
            validateKpiRow({
              record,

              rowNumber,

              issues,
            })
          :
            validateVarianceRow({
              record,

              rowNumber,

              issues,
            });


      if (
        row &&
        problems.length ===
          0 &&
        untitled ===
          0
      ) {
        rows.push(
          row,
        );
      }
    },
  );


  const duplicateKeys =
    new Set<
      string
    >();


  const seen =
    new Set<
      string
    >();


  for (
    const row
    of rows
  ) {
    const key =
      row.kind ===
        "ACTUALS"
        ?
          row.periodKey
        :
          `${row.periodKey}:${row.metricCode}`;


    if (
      seen.has(
        key,
      )
    ) {
      duplicateKeys.add(
        key,
      );

      issues.push({
        row:
          row.rowNumber,

        field:
          "duplicate",

        message:
          `Duplicate import key: ${key}.`,
      });
    }


    seen.add(
      key,
    );
  }


  return {
    importType,

    headers,

    delimiter,

    renamedColumns:
      titles.renamed,

    ignoredColumns:
      titles.ignored,

    readValues:
      Array.from(
        readValues.values(),
      ),

    layout: {
      titleRow:
        file.titleRow,

      emptyColumns:
        file.emptyColumns,

      emptyNumbers,
    },

    rowCount:
      records.length,

    issues,

    rows:
      duplicateKeys.size >
        0
        ?
          []
        :
          rows,

    preview:
      records.slice(
        0,
        8,
      ),
  };
}
