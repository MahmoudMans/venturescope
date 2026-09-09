import {
  deterministicAlertFingerprint,
} from "@/lib/notifications/fingerprint";

import type {
  ProjectAlert,
  ProjectAlertInput,
  ProjectAlertSeverity,
} from "@/lib/notifications/types";


const SEVERITY_ORDER = {
  CRITICAL:
    0,

  WARNING:
    1,

  INFO:
    2,
} as const;


function alert({
  key,
  category,
  severity,
  title,
  detail,
  sourceHref,
  sourceLabel,
  createdAt =
    null,
}: Omit<
  ProjectAlert,
  "fingerprint" | "createdAt"
> & {
  createdAt?:
    string |
    null;
}): ProjectAlert {
  return {
    key,

    category,

    severity,

    title,

    detail,

    sourceHref,

    sourceLabel,

    createdAt,

    fingerprint:
      deterministicAlertFingerprint(
        [
          key,
          category,
          severity,
          title,
          detail,
          sourceHref,
        ].join(
          "|",
        ),
      ),
  };
}


function actionSeverity(
  priority:
    string,
): ProjectAlertSeverity {
  if (
    priority ===
    "CRITICAL"
  ) {
    return "CRITICAL";
  }


  if (
    priority ===
    "HIGH"
  ) {
    return "WARNING";
  }


  return "INFO";
}


export function deriveProjectAlerts({
  projectId,
  latestActualPeriod,
  liveSnapshot,
  scorecard,
  varianceReview,
  periodRegister,
  actions,
  auditEvents,
}: ProjectAlertInput): ProjectAlert[] {
  const alerts:
    ProjectAlert[] =
      [];


  const riskLevel =
    liveSnapshot.kpis
      .liquidityRiskLevel;


  if (
    riskLevel ===
      "CRITICAL" ||
    riskLevel ===
      "HIGH"
  ) {
    alerts.push(
      alert({
        key:
          "LIQUIDITY_RISK",

        category:
          "LIQUIDITY",

        severity:
          riskLevel ===
            "CRITICAL"
            ?
              "CRITICAL"
            :
              "WARNING",

        title:
          `${riskLevel.toLowerCase()} liquidity risk`,

        detail:
          `Liquidity risk score ${liveSnapshot.kpis.liquidityRiskScore}/100; downside minimum cash ${String(
            liveSnapshot.kpis.minimumDownsideCash,
          )}; exhaustion ${liveSnapshot.kpis.downsideCashExhaustionPeriod ?? "not modeled"}.`,

        sourceHref:
          `/projects/${projectId}/risk-center`,

        sourceLabel:
          "Risk Center",
      }),
    );
  }


  if (
    liveSnapshot.kpis
      .downsideCashExhaustionPeriod
  ) {
    alerts.push(
      alert({
        key:
          "DOWNSIDE_CASH_EXHAUSTION",

        category:
          "LIQUIDITY",

        severity:
          "CRITICAL",

        title:
          "Downside case exhausts cash",

        detail:
          `Modeled downside cash exhaustion occurs in ${liveSnapshot.kpis.downsideCashExhaustionPeriod}.`,

        sourceHref:
          `/projects/${projectId}/sensitivity-lab`,

        sourceLabel:
          "Sensitivity Lab",
      }),
    );
  }


  if (
    liveSnapshot.kpis
      .capitalNeed >
    0
  ) {
    alerts.push(
      alert({
        key:
          "CAPITAL_NEED",

        category:
          "CAPITAL",

        severity:
          liveSnapshot.kpis
            .downsideCashExhaustionPeriod
            ?
              "CRITICAL"
            :
              "WARNING",

        title:
          "Additional capital is required",

        detail:
          `Current downside capital requirement: ${liveSnapshot.kpis.capitalNeed}.`,

        sourceHref:
          `/projects/${projectId}/capital-planning`,

        sourceLabel:
          "Capital Planning",
      }),
    );
  }


  if (
    liveSnapshot.kpis
      .forecastAccuracyScore !==
      null &&
    liveSnapshot.kpis
      .forecastAccuracyScore <
      0.80
  ) {
    alerts.push(
      alert({
        key:
          "FORECAST_ACCURACY",

        category:
          "FORECAST",

        severity:
          liveSnapshot.kpis
            .forecastAccuracyScore <
            0.65
            ?
              "CRITICAL"
            :
              "WARNING",

        title:
          "Forecast accuracy requires attention",

        detail:
          `Historical forecast accuracy is ${(liveSnapshot.kpis.forecastAccuracyScore * 100).toFixed(
            1,
          )}%.`,

        sourceHref:
          `/projects/${projectId}/forecast-accuracy`,

        sourceLabel:
          "Forecast Accuracy",
      }),
    );
  }


  for (
    const actionItem
    of actions
  ) {
    if (
      actionItem.status ===
        "DONE" ||
      actionItem.status ===
        "DISMISSED"
    ) {
      continue;
    }


    if (
      actionItem.priority !==
        "CRITICAL" &&
      actionItem.priority !==
        "HIGH"
    ) {
      continue;
    }


    alerts.push(
      alert({
        key:
          `ACTION:${actionItem.id}`,

        category:
          "ACTION",

        severity:
          actionSeverity(
            actionItem.priority,
          ),

        title:
          actionItem.title,

        detail:
          `${actionItem.priority} priority · ${actionItem.status} · owner ${actionItem.ownerName ?? "unassigned"} · due ${actionItem.dueDate ?? "not set"}.`,

        sourceHref:
          `/projects/${projectId}/decision-center`,

        sourceLabel:
          "Decision Center",
      }),
    );
  }


  for (
    const row
    of scorecard.rows
  ) {
    if (
      row.status !==
        "OFF_TRACK" &&
      row.status !==
        "AT_RISK"
    ) {
      continue;
    }


    alerts.push(
      alert({
        key:
          `KPI:${row.target.id}`,

        category:
          "KPI",

        severity:
          row.status ===
            "OFF_TRACK"
            ?
              "WARNING"
            :
              "INFO",

        title:
          `${row.target.metricCode} target ${row.status.toLowerCase().replace(
            "_",
            " ",
          )}`,

        detail:
          `${row.target.periodKey} · target ${row.target.targetValue} · current ${row.currentValue ?? "unavailable"} · source ${row.source}.`,

        sourceHref:
          `/projects/${projectId}/scorecard`,

        sourceLabel:
          "Scorecard",
      }),
    );
  }


  for (
    const row
    of varianceReview.rows
  ) {
    if (
      row.materiality !==
        "MATERIAL" ||
      row.commentary !==
        null
    ) {
      continue;
    }


    alerts.push(
      alert({
        key:
          `VARIANCE:${row.key}`,

        category:
          "VARIANCE",

        severity:
          row.favorability ===
            "UNFAVORABLE"
            ?
              "CRITICAL"
            :
              "WARNING",

        title:
          `Material ${row.metricCode} variance is unexplained`,

        detail:
          `${row.periodKey} · variance ${row.variance ?? "unavailable"} · rate ${row.varianceRate ?? "unavailable"} · ${row.favorability}.`,

        sourceHref:
          `/projects/${projectId}/variance-review`,

        sourceLabel:
          "Variance Review",
      }),
    );
  }


  if (
    latestActualPeriod
  ) {
    const latestClose =
      periodRegister.rows.find(
        (
          row,
        ) =>
          row.periodKey ===
          latestActualPeriod,
      );


    if (
      latestClose?.status ===
      "OPEN"
    ) {
      alerts.push(
        alert({
          key:
            `FINANCIAL_CLOSE:${latestActualPeriod}`,

          category:
            "FINANCIAL_CLOSE",

          severity:
            "WARNING",

          title:
            `${latestActualPeriod} financial period remains open`,

          detail:
            "The latest Actual period has not yet been financially closed.",

          sourceHref:
            `/projects/${projectId}/period-close`,

          sourceLabel:
            "Financial Close",
        }),
      );
    }
  }


  for (
    const event
    of auditEvents
  ) {
    const significant =
      event.severity ===
        "CRITICAL" ||
      event.action ===
        "FINANCIAL_PERIOD_REOPENED";


    if (
      !significant
    ) {
      continue;
    }


    alerts.push(
      alert({
        key:
          `AUDIT:${event.id}`,

        category:
          "GOVERNANCE",

        severity:
          event.severity,

        title:
          event.action
            .toLowerCase()
            .replaceAll(
              "_",
              " ",
            ),

        detail:
          event.summary,

        sourceHref:
          `/projects/${projectId}/activity`,

        sourceLabel:
          "Activity Center",

        createdAt:
          event.createdAt,
      }),
    );
  }


  return alerts
    .sort(
      (
        left,
        right,
      ) => {
        const severity =
          SEVERITY_ORDER[
            left.severity
          ] -
          SEVERITY_ORDER[
            right.severity
          ];


        if (
          severity !==
          0
        ) {
          return severity;
        }


        const created =
          (
            right.createdAt ??
            ""
          ).localeCompare(
            left.createdAt ??
            "",
          );


        if (
          created !==
          0
        ) {
          return created;
        }


        return left.title.localeCompare(
          right.title,
        );
      },
    )
    .slice(
      0,
      100,
    );
}
