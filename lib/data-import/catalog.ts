import {
  DATA_IMPORT_STATUSES,
  DATA_IMPORT_TYPES,
  type DataImportStatus,
  type DataImportType,
} from "@/lib/data-import/types";


export const DATA_IMPORT_MAX_BYTES =
  512 *
  1024;


export const DATA_IMPORT_MAX_ROWS:
  Record<
    DataImportType,
    number
  > = {
    ACTUALS:
      120,

    KPI_TARGETS:
      500,

    VARIANCE_COMMENTARY:
      500,
  };


export const DATA_IMPORT_TEMPLATE:
  Record<
    DataImportType,
    string
  > = {
    ACTUALS: [
      "period,revenue,cogs,operatingExpenses,ebitda,netIncome,cashFlow,cashBalance,mrr,customers",
      "2027-01,100000,30000,50000,20000,15000,10000,250000,25000,125",
    ].join(
      "\n",
    ),

    KPI_TARGETS: [
      "periodKey,metricCode,targetValue,ownerName,note",
      "2027-01,REVENUE,120000,Commercial Lead,Monthly management commitment",
      "2027-01,EBITDA_MARGIN,20,Finance Lead,20 means 20 percent",
    ].join(
      "\n",
    ),

    VARIANCE_COMMENTARY: [
      "periodKey,metricCode,causeCode,varianceNature,explanation,correctiveAction,ownerName,recoveryPeriodKey,status",
      "2027-01,REVENUE,VOLUME,RECURRING,Pipeline conversion below plan,Increase qualified pipeline,Commercial Lead,2027-03,MONITORING",
    ].join(
      "\n",
    ),
  };


export function parseDataImportType(
  value:
    string,
): DataImportType {
  if (
    DATA_IMPORT_TYPES.includes(
      value as
        DataImportType,
    )
  ) {
    return value as
      DataImportType;
  }


  throw new Error(
    "Invalid data import type.",
  );
}


export function parseDataImportStatus(
  value:
    string,
): DataImportStatus {
  if (
    DATA_IMPORT_STATUSES.includes(
      value as
        DataImportStatus,
    )
  ) {
    return value as
      DataImportStatus;
  }


  throw new Error(
    "Invalid data import status.",
  );
}
