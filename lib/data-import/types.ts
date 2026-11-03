import type {
  CsvDelimiter,
} from "@/lib/data-import/delimiter";

import type {
  TableLayout,
} from "@/lib/data-import/table";

import type {
  KpiMetricCode,
} from "@/lib/finance/scorecard/types";

import type {
  VarianceCauseCode,
  VarianceCommentaryStatus,
  VarianceMetricCode,
  VarianceNature,
} from "@/lib/finance/variance-review/types";


export const DATA_IMPORT_TYPES = [
  "ACTUALS",
  "KPI_TARGETS",
  "VARIANCE_COMMENTARY",
] as const;


export type DataImportType =
  typeof DATA_IMPORT_TYPES[
    number
  ];


export const DATA_IMPORT_STATUSES = [
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
] as const;


export type DataImportStatus =
  typeof DATA_IMPORT_STATUSES[
    number
  ];


export type DataImportIssue = {
  row:
    number;

  field:
    string;

  message:
    string;
};


export type NormalizedActualImportRow = {
  kind:
    "ACTUALS";

  rowNumber:
    number;

  periodKey:
    string;

  revenue:
    number |
    null;

  cogs:
    number |
    null;

  operatingExpenses:
    number |
    null;

  ebitda:
    number |
    null;

  netIncome:
    number |
    null;

  cashFlow:
    number |
    null;

  cashBalance:
    number |
    null;

  mrr:
    number |
    null;

  customers:
    number |
    null;
};


export type NormalizedKpiImportRow = {
  kind:
    "KPI_TARGETS";

  rowNumber:
    number;

  periodKey:
    string;

  metricCode:
    KpiMetricCode;

  targetValue:
    number;

  ownerName:
    string |
    null;

  note:
    string |
    null;
};


export type NormalizedVarianceImportRow = {
  kind:
    "VARIANCE_COMMENTARY";

  rowNumber:
    number;

  periodKey:
    string;

  metricCode:
    VarianceMetricCode;

  causeCode:
    VarianceCauseCode;

  varianceNature:
    VarianceNature;

  explanation:
    string;

  correctiveAction:
    string |
    null;

  ownerName:
    string |
    null;

  recoveryPeriodKey:
    string |
    null;

  status:
    VarianceCommentaryStatus;
};


export type NormalizedDataImportRow =
  | NormalizedActualImportRow
  | NormalizedKpiImportRow
  | NormalizedVarianceImportRow;


export type DataImportValidationResult = {
  importType:
    DataImportType;

  headers:
    string[];

  delimiter:
    CsvDelimiter;

  renamedColumns:
    {
      title:
        string;

      field:
        string;
    }[];

  ignoredColumns:
    string[];

  readValues:
    {
      field:
        string;

      text:
        string;

      code:
        string;
    }[];

  layout:
    TableLayout;

  rowCount:
    number;

  issues:
    DataImportIssue[];

  rows:
    NormalizedDataImportRow[];

  preview:
    Record<
      string,
      string
    >[];
};


export type DataImportBatchView = {
  id:
    string;

  importType:
    DataImportType;

  fileName:
    string;

  status:
    DataImportStatus;

  rowCount:
    number;

  insertedCount:
    number;

  updatedCount:
    number;

  rejectedCount:
    number;

  errorSummary:
    string |
    null;

  createdBy:
    string |
    null;

  createdAt:
    string;

  completedAt:
    string |
    null;
};
