import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import {
  decimal,
} from "@/lib/finance/math";
import {
  formatLongMonthKey,
  formatRunway,
} from "@/lib/finance/formatting";
import type {
  ReadyReportContext,
} from "@/lib/reports/context";
import {
  buildExecutiveSummary,
} from "@/lib/reports/summary";
import {
  scenarioModifiersToFormValues,
} from "@/lib/scenarios/modifiers";

const PAGE_WIDTH =
  595.28;

const PAGE_HEIGHT =
  841.89;

const MARGIN =
  44;

const CONTENT_WIDTH =
  PAGE_WIDTH -
  MARGIN *
    2;

const COLOR_TEXT =
  rgb(
    0.10,
    0.12,
    0.16,
  );

const COLOR_MUTED =
  rgb(
    0.39,
    0.43,
    0.50,
  );

const COLOR_BORDER =
  rgb(
    0.84,
    0.86,
    0.89,
  );

const COLOR_ACCENT =
  rgb(
    0.10,
    0.22,
    0.38,
  );

type Writer = {
  pdf:
    PDFDocument;

  regular:
    PDFFont;

  bold:
    PDFFont;

  page:
    PDFPage;

  y:
    number;
};

function safePdfText(
  value:
    | string
    | number
    | null
    | undefined,
): string {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return "";
  }

  return String(
    value,
  )
    .normalize(
      "NFKD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[\u2013\u2014]/g,
      "-",
    )
    .replace(
      /[\u2018\u2019]/g,
      "'",
    )
    .replace(
      /[\u201C\u201D]/g,
      "\"",
    )
    .replace(
      /[^\x20-\x7E]/g,
      "?",
    );
}

function money(
  value: string,
  currency: string,
): string {
  const amount =
    decimal(
      value,
    ).toNumber();

  const safeAmount =
    Number.isFinite(
      amount,
    )
      ? amount
      : 0;

  return `${currency} ${new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits:
        0,

      minimumFractionDigits:
        0,
    },
  ).format(
    safeAmount,
  )}`;
}

function percentage(
  value:
    | string
    | null,
): string {
  if (
    value ===
    null
  ) {
    return "-";
  }

  const parsed =
    Number(
      value,
    );

  return `${Number.isFinite(
    parsed,
  )
    ? parsed.toFixed(
        1,
      )
    : "0.0"}%`;
}

function customers(
  value:
    | string
    | null,
): string {
  if (
    value ===
    null
  ) {
    return "-";
  }

  const parsed =
    Number(
      value,
    );

  return Number.isFinite(
    parsed,
  )
    ? Math.round(
        parsed,
      ).toLocaleString(
        "en-US",
      )
    : "0";
}

function newPage(
  writer: Writer,
): void {
  writer.page =
    writer.pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  writer.y =
    PAGE_HEIGHT -
    MARGIN;
}

function ensureSpace(
  writer: Writer,
  required: number,
): void {
  if (
    writer.y -
      required <
    MARGIN
  ) {
    newPage(
      writer,
    );
  }
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const safe =
    safePdfText(
      text,
    );

  const words =
    safe.split(
      /\s+/,
    );

  const lines: string[] =
    [];

  let current =
    "";

  for (
    const word
    of words
  ) {
    const candidate =
      current
        ? `${current} ${word}`
        : word;

    const width =
      font.widthOfTextAtSize(
        candidate,
        size,
      );

    if (
      width <=
      maxWidth
    ) {
      current =
        candidate;
      continue;
    }

    if (
      current
    ) {
      lines.push(
        current,
      );
    }

    current =
      word;
  }

  if (
    current
  ) {
    lines.push(
      current,
    );
  }

  return lines.length
    ? lines
    : [
        "",
      ];
}

function drawText(
  writer: Writer,
  text: string,
  options: {
    size?: number;

    bold?: boolean;

    color?: ReturnType<
      typeof rgb
    >;

    maxWidth?: number;

    lineHeight?: number;

    gapAfter?: number;
  } = {},
): void {
  const size =
    options.size ??
    10;

  const font =
    options.bold
      ? writer.bold
      : writer.regular;

  const maxWidth =
    options.maxWidth ??
    CONTENT_WIDTH;

  const lineHeight =
    options.lineHeight ??
    size *
      1.35;

  const lines =
    wrapText(
      text,
      font,
      size,
      maxWidth,
    );

  ensureSpace(
    writer,
    lines.length *
      lineHeight +
      (
        options.gapAfter ??
        0
      ),
  );

  for (
    const line
    of lines
  ) {
    writer.page.drawText(
      line,
      {
        x:
          MARGIN,

        y:
          writer.y,

        size,

        font,

        color:
          options.color ??
          COLOR_TEXT,
      },
    );

    writer.y -=
      lineHeight;
  }

  writer.y -=
    options.gapAfter ??
    0;
}

function drawHeading(
  writer: Writer,
  title: string,
): void {
  ensureSpace(
    writer,
    42,
  );

  writer.y -=
    4;

  drawText(
    writer,
    title,
    {
      size:
        15,

      bold:
        true,

      color:
        COLOR_ACCENT,

      gapAfter:
        8,
    },
  );

  writer.page.drawLine({
    start: {
      x:
        MARGIN,

      y:
        writer.y +
        3,
    },

    end: {
      x:
        PAGE_WIDTH -
        MARGIN,

      y:
        writer.y +
        3,
    },

    thickness:
      0.8,

    color:
      COLOR_BORDER,
  });

  writer.y -=
    8;
}

function drawKeyValueRows(
  writer: Writer,
  rows: Array<
    [
      string,
      string,
    ]
  >,
): void {
  const rowHeight =
    22;

  for (
    const [
      label,
      value,
    ]
    of rows
  ) {
    ensureSpace(
      writer,
      rowHeight,
    );

    writer.page.drawText(
      safePdfText(
        label,
      ),
      {
        x:
          MARGIN,

        y:
          writer.y,

        size:
          9,

        font:
          writer.regular,

        color:
          COLOR_MUTED,
      },
    );

    const safeValue =
      safePdfText(
        value,
      );

    const valueWidth =
      writer.bold.widthOfTextAtSize(
        safeValue,
        9,
      );

    writer.page.drawText(
      safeValue,
      {
        x:
          Math.max(
            MARGIN +
              220,
            PAGE_WIDTH -
              MARGIN -
              valueWidth,
          ),

        y:
          writer.y,

        size:
          9,

        font:
          writer.bold,

        color:
          COLOR_TEXT,
      },
    );

    writer.y -=
      rowHeight;

    writer.page.drawLine({
      start: {
        x:
          MARGIN,

        y:
          writer.y +
          8,
      },

      end: {
        x:
          PAGE_WIDTH -
          MARGIN,

        y:
          writer.y +
          8,
      },

      thickness:
        0.35,

      color:
        COLOR_BORDER,
    });
  }

  writer.y -=
    6;
}

function drawTable(
  writer: Writer,
  headers: string[],
  rows: string[][],
  widths: number[],
): void {
  const headerHeight =
    22;

  const rowHeight =
    19;

  const drawHeader =
    () => {
      ensureSpace(
        writer,
        headerHeight +
        rowHeight,
      );

      let x =
        MARGIN;

      writer.page.drawRectangle({
        x:
          MARGIN,

        y:
          writer.y -
          5,

        width:
          CONTENT_WIDTH,

        height:
          headerHeight,

        color:
          rgb(
            0.94,
            0.95,
            0.97,
          ),
      });

      for (
        let index =
          0;
        index <
        headers.length;
        index +=
          1
      ) {
        writer.page.drawText(
          safePdfText(
            headers[
              index
            ],
          ),
          {
            x:
              x +
              3,

            y:
              writer.y +
              2,

            size:
              7.5,

            font:
              writer.bold,

            color:
              COLOR_TEXT,
          },
        );

        x +=
          widths[
            index
          ];
      }

      writer.y -=
        headerHeight;
    };

  drawHeader();

  for (
    const row
    of rows
  ) {
    if (
      writer.y -
        rowHeight <
      MARGIN
    ) {
      newPage(
        writer,
      );

      drawHeader();
    }

    let x =
      MARGIN;

    for (
      let index =
        0;
      index <
      row.length;
      index +=
        1
    ) {
      const cell =
        safePdfText(
          row[
            index
          ],
        );

      const maxCellWidth =
        Math.max(
          10,
          widths[
            index
          ] -
          6,
        );

      let clipped =
        cell;

      while (
        clipped.length >
          1 &&
        writer.regular.widthOfTextAtSize(
          clipped,
          7.2,
        ) >
          maxCellWidth
      ) {
        clipped =
          clipped.slice(
            0,
            -1,
          );
      }

      if (
        clipped !==
        cell &&
        clipped.length >
        3
      ) {
        clipped =
          `${clipped.slice(
            0,
            -3,
          )}...`;
      }

      writer.page.drawText(
        clipped,
        {
          x:
            x +
            3,

          y:
            writer.y,

          size:
            7.2,

          font:
            writer.regular,

          color:
            COLOR_TEXT,
        },
      );

      x +=
        widths[
          index
        ];
    }

    writer.y -=
      rowHeight;

    writer.page.drawLine({
      start: {
        x:
          MARGIN,

        y:
          writer.y +
          7,
      },

      end: {
        x:
          PAGE_WIDTH -
          MARGIN,

        y:
          writer.y +
          7,
      },

      thickness:
        0.25,

      color:
        COLOR_BORDER,
    });
  }

  writer.y -=
    8;
}

function drawLineChart(
  writer: Writer,
  title: string,
  values: number[],
  labels: string[],
  currency: string,
): void {
  const height =
    145;

  ensureSpace(
    writer,
    height +
    55,
  );

  drawText(
    writer,
    title,
    {
      size:
        11,

      bold:
        true,

      gapAfter:
        6,
    },
  );

  const chartX =
    MARGIN +
    42;

  const chartY =
    writer.y -
    height +
    10;

  const chartWidth =
    CONTENT_WIDTH -
    58;

  const chartHeight =
    height -
    24;

  const safeValues =
    values.length
      ? values
      : [
          0,
        ];

  let minimum =
    Math.min(
      ...safeValues,
      0,
    );

  let maximum =
    Math.max(
      ...safeValues,
      0,
    );

  if (
    minimum ===
    maximum
  ) {
    maximum +=
      1;
  }

  const range =
    maximum -
    minimum;

  writer.page.drawLine({
    start: {
      x:
        chartX,

      y:
        chartY,
    },

    end: {
      x:
        chartX,

      y:
        chartY +
        chartHeight,
    },

    thickness:
      0.6,

    color:
      COLOR_BORDER,
  });

  writer.page.drawLine({
    start: {
      x:
        chartX,

      y:
        chartY,
    },

    end: {
      x:
        chartX +
        chartWidth,

      y:
        chartY,
    },

    thickness:
      0.6,

    color:
      COLOR_BORDER,
  });

  if (
    minimum <
      0 &&
    maximum >
      0
  ) {
    const zeroY =
      chartY +
      (
        (
          0 -
          minimum
        ) /
        range
      ) *
        chartHeight;

    writer.page.drawLine({
      start: {
        x:
          chartX,

        y:
          zeroY,
      },

      end: {
        x:
          chartX +
          chartWidth,

        y:
          zeroY,
      },

      thickness:
        0.5,

      color:
        COLOR_BORDER,
    });
  }

  for (
    let index =
      1;
    index <
    safeValues.length;
    index +=
      1
  ) {
    const previous =
      safeValues[
        index -
        1
      ];

    const current =
      safeValues[
        index
      ];

    const previousX =
      chartX +
      (
        (
          index -
          1
        ) /
        Math.max(
          1,
          safeValues.length -
            1,
        )
      ) *
        chartWidth;

    const currentX =
      chartX +
      (
        index /
        Math.max(
          1,
          safeValues.length -
            1,
        )
      ) *
        chartWidth;

    const previousY =
      chartY +
      (
        (
          previous -
          minimum
        ) /
        range
      ) *
        chartHeight;

    const currentY =
      chartY +
      (
        (
          current -
          minimum
        ) /
        range
      ) *
        chartHeight;

    writer.page.drawLine({
      start: {
        x:
          previousX,

        y:
          previousY,
      },

      end: {
        x:
          currentX,

        y:
          currentY,
      },

      thickness:
        1.5,

      color:
        COLOR_ACCENT,
    });
  }

  writer.page.drawText(
    safePdfText(
      money(
        String(
          maximum,
        ),
        currency,
      ),
    ),
    {
      x:
        MARGIN,

      y:
        chartY +
        chartHeight -
        2,

      size:
        6.5,

      font:
        writer.regular,

      color:
        COLOR_MUTED,
    },
  );

  writer.page.drawText(
    safePdfText(
      money(
        String(
          minimum,
        ),
        currency,
      ),
    ),
    {
      x:
        MARGIN,

      y:
        chartY -
        1,

      size:
        6.5,

      font:
        writer.regular,

      color:
        COLOR_MUTED,
    },
  );

  if (
    labels.length >
    0
  ) {
    writer.page.drawText(
      safePdfText(
        labels[0],
      ),
      {
        x:
          chartX,

        y:
          chartY -
          13,

        size:
          6.5,

        font:
          writer.regular,

        color:
          COLOR_MUTED,
      },
    );

    const last =
      safePdfText(
        labels[
          labels.length -
            1
        ],
      );

    const width =
      writer.regular.widthOfTextAtSize(
        last,
        6.5,
      );

    writer.page.drawText(
      last,
      {
        x:
          chartX +
          chartWidth -
          width,

        y:
          chartY -
          13,

        size:
          6.5,

        font:
          writer.regular,

        color:
          COLOR_MUTED,
      },
    );
  }

  writer.y =
    chartY -
    26;
}

function titlePage(
  writer: Writer,
  context: ReadyReportContext,
): void {
  const {
    project,
    forecast,
  } = context;

  writer.page.drawText(
    "VENTURESCOPE",
    {
      x:
        MARGIN,

      y:
        PAGE_HEIGHT -
        90,

      size:
        12,

      font:
        writer.bold,

      color:
        COLOR_ACCENT,
    },
  );

  writer.page.drawText(
    safePdfText(
      project.name,
    ),
    {
      x:
        MARGIN,

      y:
        PAGE_HEIGHT -
        145,

      size:
        28,

      font:
        writer.bold,

      color:
        COLOR_TEXT,
    },
  );

  writer.page.drawText(
    "Financial Planning & Scenario Simulation Report",
    {
      x:
        MARGIN,

      y:
        PAGE_HEIGHT -
        177,

      size:
        13,

      font:
        writer.regular,

      color:
        COLOR_MUTED,
    },
  );

  writer.page.drawText(
    safePdfText(
      `Scenario: ${forecast.scenario.name}`,
    ),
    {
      x:
        MARGIN,

      y:
        PAGE_HEIGHT -
        224,

      size:
        11,

      font:
        writer.bold,

      color:
        COLOR_TEXT,
    },
  );

  writer.page.drawText(
    safePdfText(
      `Currency: ${forecast.currency}`,
    ),
    {
      x:
        MARGIN,

      y:
        PAGE_HEIGHT -
        246,

      size:
        10,

      font:
        writer.regular,

      color:
        COLOR_MUTED,
    },
  );

  writer.page.drawText(
    safePdfText(
      `Forecast: ${forecast.startMonth} | ${forecast.horizonMonths} months`,
    ),
    {
      x:
        MARGIN,

      y:
        PAGE_HEIGHT -
        264,

      size:
        10,

      font:
        writer.regular,

      color:
        COLOR_MUTED,
    },
  );

  writer.page.drawText(
    safePdfText(
      `Generated: ${new Date().toISOString()}`,
    ),
    {
      x:
        MARGIN,

      y:
        70,

      size:
        8,

      font:
        writer.regular,

      color:
        COLOR_MUTED,
    },
  );
}

export async function buildExecutivePdf(
  context: ReadyReportContext,
): Promise<Uint8Array> {
  const pdf =
    await PDFDocument.create();

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica,
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );

  pdf.setTitle(
    safePdfText(
      `${context.project.name} - VentureScope Financial Report`,
    ),
  );

  pdf.setAuthor(
    "VentureScope",
  );

  pdf.setSubject(
    "Financial Planning and Scenario Simulation Report",
  );

  pdf.setCreator(
    "VentureScope",
  );

  const writer: Writer =
    {
      pdf,

      regular,

      bold,

      page:
        pdf.addPage([
          PAGE_WIDTH,
          PAGE_HEIGHT,
        ]),

      y:
        PAGE_HEIGHT -
        MARGIN,
    };

  titlePage(
    writer,
    context,
  );

  newPage(
    writer,
  );

  drawHeading(
    writer,
    "Executive Summary",
  );

  for (
    const paragraph
    of buildExecutiveSummary(
      context,
    )
  ) {
    drawText(
      writer,
      paragraph,
      {
        size:
          10,

        lineHeight:
          14,

        gapAfter:
          7,
      },
    );
  }

  drawHeading(
    writer,
    "Key Financial Metrics",
  );

  drawKeyValueRows(
    writer,
    [
      [
        "First-year revenue",
        money(
          context.forecast
            .metrics
            .firstYearRevenue,
          context.forecast
            .currency,
        ),
      ],

      [
        "First-year EBITDA",
        money(
          context.forecast
            .metrics
            .firstYearEbitda,
          context.forecast
            .currency,
        ),
      ],

      [
        "Gross margin",
        percentage(
          context.forecast
            .metrics
            .grossMarginPercentage,
        ),
      ],

      [
        "EBITDA margin",
        percentage(
          context.forecast
            .metrics
            .ebitdaMarginPercentage,
        ),
      ],

      [
        "Ending cash",
        money(
          context.forecast
            .metrics
            .endingCash,
          context.forecast
            .currency,
        ),
      ],

      [
        "Runway",
        formatRunway(
          context.forecast
            .metrics
            .runway,
        ),
      ],

      [
        "Ending MRR",
        money(
          context.forecast
            .metrics
            .endingMrr,
          context.forecast
            .currency,
        ),
      ],

      [
        "Ending ARR",
        money(
          context.forecast
            .metrics
            .endingArr,
          context.forecast
            .currency,
        ),
      ],

      [
        "Sustained break-even",
        context.forecast
          .metrics
          .breakEven
          .sustainedBreakEvenMonth
          ? formatLongMonthKey(
              context.forecast
                .metrics
                .breakEven
                .sustainedBreakEvenMonth,
            )
          : "Not reached",
      ],
    ],
  );

  drawLineChart(
    writer,
    "Revenue Forecast",
    context.forecast
      .months.map(
        (
          month,
        ) =>
          Number(
            month.revenue,
          ),
      ),
    context.forecast
      .months.map(
        (
          month,
        ) =>
          month.month,
      ),
    context.forecast
      .currency,
  );

  drawLineChart(
    writer,
    "Ending Cash Forecast",
    context.forecast
      .months.map(
        (
          month,
        ) =>
          Number(
            month.endingCash,
          ),
      ),
    context.forecast
      .months.map(
        (
          month,
        ) =>
          month.month,
      ),
    context.forecast
      .currency,
  );

  drawHeading(
    writer,
    "Annual Forecast",
  );

  drawTable(
    writer,
    [
      "Year",
      "Revenue",
      "Gross Profit",
      "EBITDA",
      "Net Income",
      "End Cash",
      "End MRR",
    ],
    context.forecast
      .annual.map(
        (
          year,
        ) => [
          String(
            year.year,
          ),

          money(
            year.revenue,
            context.forecast
              .currency,
          ),

          money(
            year.grossProfit,
            context.forecast
              .currency,
          ),

          money(
            year.ebitda,
            context.forecast
              .currency,
          ),

          money(
            year.netIncome,
            context.forecast
              .currency,
          ),

          money(
            year.endingCash,
            context.forecast
              .currency,
          ),

          money(
            year.endingMrr,
            context.forecast
              .currency,
          ),
        ],
      ),
    [
      42,
      79,
      79,
      72,
      72,
      80,
      80,
    ],
  );

  drawHeading(
    writer,
    "Scenario Comparison",
  );

  drawTable(
    writer,
    [
      "Scenario",
      "Revenue",
      "EBITDA",
      "End Cash",
      "End MRR",
      "Runway",
    ],
    context.comparison.map(
      (
        item,
      ) => [
        item.scenarioName,

        money(
          item.firstYearRevenue,
          context.forecast
            .currency,
        ),

        money(
          item.firstYearEbitda,
          context.forecast
            .currency,
        ),

        money(
          item.endingCash,
          context.forecast
            .currency,
        ),

        money(
          item.endingMrr,
          context.forecast
            .currency,
        ),

        formatRunway(
          item.runway,
        ),
      ],
    ),
    [
      90,
      88,
      80,
      88,
      88,
      73,
    ],
  );

  drawHeading(
    writer,
    "Key Assumptions",
  );

  const assumptions =
    context.assumptions;

  drawKeyValueRows(
    writer,
    [
      [
        "Revenue model",
        context.project
          .revenueMode ===
        "DIRECT"
          ? "Direct Revenue"
          : "Customer-Driven",
      ],

      [
        "Starting cash",
        money(
          assumptions.general
            .startingCash,
          context.project
            .currency,
        ),
      ],

      [
        "Corporate tax",
        `${assumptions.general.corporateTaxRate}%`,
      ],

      [
        "Monthly salaries",
        money(
          assumptions.expenses
            .salaries
            .monthlyAmount,
          context.project
            .currency,
        ),
      ],

      [
        "Monthly rent",
        money(
          assumptions.expenses
            .rent
            .monthlyAmount,
          context.project
            .currency,
        ),
      ],

      [
        "Monthly marketing",
        money(
          assumptions.expenses
            .marketing
            .monthlyAmount,
          context.project
            .currency,
        ),
      ],

      [
        "COGS method",
        assumptions.expenses
          .cogs.method,
      ],

      [
        "Financing events",
        String(
          context.project
            .financingEvents
            .length,
        ),
      ],

      [
        "Monthly overrides",
        String(
          context.project
            .monthlyOverrides
            .length,
        ),
      ],
    ],
  );

  if (
    context.project
      .revenueMode ===
    "DIRECT"
  ) {
    drawKeyValueRows(
      writer,
      [
        [
          "Starting monthly revenue",
          money(
            assumptions.directRevenue
              .startingMonthlyRevenue,
            context.project
              .currency,
          ),
        ],

        [
          "Monthly revenue growth",
          `${assumptions.directRevenue.monthlyGrowthRate}%`,
        ],

        [
          "Recurring revenue share",
          `${assumptions.directRevenue.recurringRevenuePercentage}%`,
        ],

        [
          "Monthly one-time revenue",
          money(
            assumptions.directRevenue
              .monthlyOneTimeRevenue,
            context.project
              .currency,
          ),
        ],
      ],
    );
  } else {
    drawKeyValueRows(
      writer,
      [
        [
          "Starting customers",
          assumptions.customerRevenue
            .startingCustomers,
        ],

        [
          "ARPU",
          money(
            assumptions.customerRevenue
              .arpu,
            context.project
              .currency,
          ),
        ],

        [
          "Monthly churn",
          `${assumptions.customerRevenue.monthlyChurnRate}%`,
        ],

        [
          "CAC",
          money(
            assumptions.customerRevenue
              .cac,
            context.project
              .currency,
          ),
        ],

        [
          "Organic new customers",
          assumptions.customerRevenue
            .organicNewCustomers,
        ],
      ],
    );
  }

  if (
    context.selectedScenario &&
    context.selectedScenario
      .type !==
      "BASE"
  ) {
    drawHeading(
      writer,
      "Selected Scenario Modifiers",
    );

    const modifiers =
      scenarioModifiersToFormValues(
        context.selectedScenario
          .modifiers,
        context.project
          .revenueMode,
      );

    drawKeyValueRows(
      writer,
      [
        [
          "Growth adjustment",
          `${modifiers.growthAdjustmentPercentage}%`,
        ],

        [
          "ARPU adjustment",
          `${modifiers.arpuAdjustmentPercentage}%`,
        ],

        [
          "CAC adjustment",
          `${modifiers.cacAdjustmentPercentage}%`,
        ],

        [
          "Churn adjustment",
          `${modifiers.churnDeltaPercentagePoints} pp`,
        ],

        [
          "COGS adjustment",
          `${modifiers.cogsDeltaPercentagePoints} pp`,
        ],
      ],
    );
  }

  drawHeading(
    writer,
    "Detailed Monthly Forecast",
  );

  drawTable(
    writer,
    [
      "Month",
      "Revenue",
      "EBITDA",
      "Net Income",
      "End Cash",
      "MRR",
    ],
    context.forecast
      .months.map(
        (
          month,
        ) => [
          month.month,

          money(
            month.revenue,
            context.forecast
              .currency,
          ),

          money(
            month.ebitda,
            context.forecast
              .currency,
          ),

          money(
            month.netIncome,
            context.forecast
              .currency,
          ),

          money(
            month.endingCash,
            context.forecast
              .currency,
          ),

          money(
            month.mrr,
            context.forecast
              .currency,
          ),
        ],
      ),
    [
      60,
      90,
      84,
      84,
      94,
      95,
    ],
  );

  if (
    context.forecast
      .revenueMode ===
    "CUSTOMER_DRIVEN"
  ) {
    drawHeading(
      writer,
      "Customer Summary",
    );

    const lastMonth =
      context.forecast
        .months[
          context.forecast
            .months.length -
            1
        ];

    drawKeyValueRows(
      writer,
      [
        [
          "Ending customers",
          customers(
            lastMonth
              .endingCustomers,
          ),
        ],

        [
          "Ending ARPU",
          money(
            lastMonth.arpu ??
            "0",
            context.forecast
              .currency,
          ),
        ],

        [
          "Ending MRR",
          money(
            lastMonth.mrr,
            context.forecast
              .currency,
          ),
        ],
      ],
    );
  }

  return pdf.save();
}
