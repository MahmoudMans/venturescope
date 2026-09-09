import type {
  PlanningTemplate,
} from "@/lib/finance/planning-templates/types";


function deepFreeze<
  T,
>(
  value:
    T,
): T {
  if (
    value !==
      null &&
    typeof value ===
      "object" &&
    !Object.isFrozen(
      value,
    )
  ) {
    Object.freeze(
      value,
    );


    for (
      const child
      of Object.values(
        value as
          Record<
            string,
            unknown
          >,
      )
    ) {
      deepFreeze(
        child,
      );
    }
  }


  return value;
}


const templates:
  PlanningTemplate[] = [
    {
      id:
        "b2b-saas",

      name:
        "B2B SaaS",

      segment:
        "Software & SaaS",

      description:
        "Recurring-revenue software model centered on customer acquisition, ARPU, churn, gross margin, headcount, and runway.",

      keywords: [
        "saas",
        "software",
        "subscription software",
        "b2b",
        "cloud",
        "platform",
        "app",
      ],

      revenueModel:
        "CUSTOMER_DRIVEN",

      horizonGuidance:
        36,

      assumptions: [
        {
          key:
            "starting_customers",

          label:
            "Starting customers",

          value:
            100,

          unit:
            "count",

          area:
            "REVENUE",

          rationale:
            "Creates an explicit opening installed base for recurring revenue.",
        },

        {
          key:
            "monthly_arpu",

          label:
            "Monthly ARPU",

          value:
            120,

          unit:
            "currency",

          area:
            "REVENUE",

          rationale:
            "Anchors recurring revenue per active customer.",
        },

        {
          key:
            "monthly_customer_growth",

          label:
            "Monthly customer growth",

          value:
            0.08,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "Useful starting point for an early growth-stage planning case.",
        },

        {
          key:
            "monthly_churn",

          label:
            "Monthly churn",

          value:
            0.025,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "Retention usually becomes one of the highest-leverage SaaS assumptions.",
        },

        {
          key:
            "gross_margin",

          label:
            "Gross margin",

          value:
            0.82,

          unit:
            "%",

          area:
            "COGS",

          rationale:
            "Software delivery costs are generally lower than revenue at scale.",
        },

        {
          key:
            "sales_marketing_ratio",

          label:
            "Sales & marketing / revenue",

          value:
            0.30,

          unit:
            "%",

          area:
            "OPEX",

          rationale:
            "Growth investment should be visible as a deliberate operating choice.",
        },

        {
          key:
            "cash_runway_target",

          label:
            "Cash runway target",

          value:
            18,

          unit:
            "months",

          area:
            "CASH",

          rationale:
            "Provides management time to react before a future financing deadline.",
        },
      ],

      kpis: [
        "MRR / ARR",
        "Customer growth",
        "Churn",
        "ARPU",
        "CAC",
        "CAC payback",
        "Gross margin",
        "Burn multiple",
        "Runway",
      ],

      risks: [
        {
          title:
            "Retention deterioration",

          severity:
            "HIGH",

          watch:
            "Small churn changes compound rapidly through recurring revenue.",
        },

        {
          title:
            "Growth efficiency",

          severity:
            "HIGH",

          watch:
            "Acquisition growth can destroy cash if CAC rises faster than lifetime value.",
        },

        {
          title:
            "Premature hiring",

          severity:
            "MEDIUM",

          watch:
            "Headcount expansion can outrun validated demand.",
        },
      ],

      managementQuestions: [
        "Is customer growth coming from repeatable acquisition channels?",
        "Is churn improving as the installed base grows?",
        "Does CAC payback justify the current growth budget?",
        "How much runway remains under a downside growth case?",
      ],
    },

    {
      id:
        "ecommerce",

      name:
        "E-commerce",

      segment:
        "Commerce",

      description:
        "Direct online commerce model centered on order volume, average order value, gross margin, marketing efficiency, and working-capital pressure.",

      keywords: [
        "ecommerce",
        "e-commerce",
        "online shop",
        "online store",
        "retail online",
        "commerce",
        "shopify",
        "consumer goods",
      ],

      revenueModel:
        "DIRECT",

      horizonGuidance:
        24,

      assumptions: [
        {
          key:
            "monthly_orders",

          label:
            "Monthly orders",

          value:
            1500,

          unit:
            "count",

          area:
            "REVENUE",

          rationale:
            "Order volume is a practical operating revenue driver.",
        },

        {
          key:
            "average_order_value",

          label:
            "Average order value",

          value:
            75,

          unit:
            "currency",

          area:
            "REVENUE",

          rationale:
            "Separates traffic/conversion performance from basket economics.",
        },

        {
          key:
            "monthly_order_growth",

          label:
            "Monthly order growth",

          value:
            0.05,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "Makes growth expectations explicit rather than hiding them in revenue.",
        },

        {
          key:
            "gross_margin",

          label:
            "Gross margin",

          value:
            0.45,

          unit:
            "%",

          area:
            "COGS",

          rationale:
            "Product and fulfillment economics dominate commerce profitability.",
        },

        {
          key:
            "marketing_ratio",

          label:
            "Marketing / revenue",

          value:
            0.18,

          unit:
            "%",

          area:
            "OPEX",

          rationale:
            "Paid acquisition can materially change contribution margin.",
        },

        {
          key:
            "inventory_buffer",

          label:
            "Inventory cash buffer",

          value:
            2,

          unit:
            "months",

          area:
            "CASH",

          rationale:
            "Inventory purchasing frequently creates a cash need before revenue is collected.",
        },
      ],

      kpis: [
        "Orders",
        "Average order value",
        "Conversion rate",
        "Gross margin",
        "Contribution margin",
        "CAC",
        "Repeat purchase",
        "Inventory turns",
        "Cash conversion",
      ],

      risks: [
        {
          title:
            "Paid acquisition inflation",

          severity:
            "HIGH",

          watch:
            "Higher CAC can erase contribution margin even when topline revenue grows.",
        },

        {
          title:
            "Inventory overbuy",

          severity:
            "HIGH",

          watch:
            "Inventory consumes cash before demand is proven.",
        },

        {
          title:
            "Margin compression",

          severity:
            "MEDIUM",

          watch:
            "Discounting and logistics costs can reduce gross margin.",
        },
      ],

      managementQuestions: [
        "Are additional orders contribution-margin positive?",
        "How sensitive cash is to slower inventory turnover?",
        "What percentage of growth depends on paid acquisition?",
        "Does repeat purchase improve customer economics?",
      ],
    },

    {
      id:
        "agency-services",

      name:
        "Agency & Professional Services",

      segment:
        "Professional Services",

      description:
        "People-led services model centered on billable clients, utilization, average monthly revenue per client, payroll, and operating leverage.",

      keywords: [
        "agency",
        "consulting",
        "consultancy",
        "professional services",
        "services",
        "marketing agency",
        "development agency",
        "design agency",
        "advisory",
      ],

      revenueModel:
        "DIRECT",

      horizonGuidance:
        24,

      assumptions: [
        {
          key:
            "active_clients",

          label:
            "Active clients",

          value:
            20,

          unit:
            "count",

          area:
            "REVENUE",

          rationale:
            "Client count provides a clear commercial operating driver.",
        },

        {
          key:
            "monthly_revenue_per_client",

          label:
            "Monthly revenue / client",

          value:
            5000,

          unit:
            "currency",

          area:
            "REVENUE",

          rationale:
            "Separates account growth from client acquisition.",
        },

        {
          key:
            "client_growth",

          label:
            "Monthly client growth",

          value:
            0.03,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "Services organizations often scale through incremental client wins.",
        },

        {
          key:
            "delivery_margin",

          label:
            "Delivery gross margin",

          value:
            0.50,

          unit:
            "%",

          area:
            "COGS",

          rationale:
            "Delivery labor and subcontractors should remain visible in unit economics.",
        },

        {
          key:
            "billable_utilization",

          label:
            "Billable utilization",

          value:
            0.72,

          unit:
            "%",

          area:
            "OPERATIONS",

          rationale:
            "Utilization is one of the central capacity and profitability drivers.",
        },

        {
          key:
            "cash_reserve",

          label:
            "Minimum cash reserve",

          value:
            3,

          unit:
            "months",

          area:
            "CASH",

          rationale:
            "Protects payroll during client or collection volatility.",
        },
      ],

      kpis: [
        "Active clients",
        "Revenue per client",
        "Billable utilization",
        "Gross margin",
        "Revenue per employee",
        "Pipeline coverage",
        "Client concentration",
        "Cash collections",
      ],

      risks: [
        {
          title:
            "Client concentration",

          severity:
            "HIGH",

          watch:
            "Loss of one major client can materially reduce revenue.",
        },

        {
          title:
            "Utilization decline",

          severity:
            "HIGH",

          watch:
            "Payroll remains while bench time reduces billable output.",
        },

        {
          title:
            "Collection delays",

          severity:
            "MEDIUM",

          watch:
            "Accounting profitability can diverge from cash availability.",
        },
      ],

      managementQuestions: [
        "What percentage of revenue comes from the largest three clients?",
        "Is utilization sustainable without overloading delivery teams?",
        "Does hiring follow contracted demand or hoped-for pipeline?",
        "Are payment terms creating avoidable liquidity pressure?",
      ],
    },

    {
      id:
        "marketplace",

      name:
        "Marketplace",

      segment:
        "Digital Marketplace",

      description:
        "Two-sided marketplace model centered on transaction volume, take rate, buyer and seller growth, liquidity, and acquisition efficiency.",

      keywords: [
        "marketplace",
        "two sided marketplace",
        "platform marketplace",
        "buyers sellers",
        "gig",
        "booking marketplace",
        "transaction platform",
      ],

      revenueModel:
        "MARKETPLACE",

      horizonGuidance:
        36,

      assumptions: [
        {
          key:
            "monthly_gmv",

          label:
            "Monthly GMV",

          value:
            250000,

          unit:
            "currency",

          area:
            "REVENUE",

          rationale:
            "GMV separates marketplace economic activity from recognized revenue.",
        },

        {
          key:
            "take_rate",

          label:
            "Take rate",

          value:
            0.15,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "The take rate converts marketplace volume into platform revenue.",
        },

        {
          key:
            "gmv_growth",

          label:
            "Monthly GMV growth",

          value:
            0.08,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "Makes network growth expectations explicit.",
        },

        {
          key:
            "transaction_cost_ratio",

          label:
            "Transaction costs / revenue",

          value:
            0.18,

          unit:
            "%",

          area:
            "COGS",

          rationale:
            "Payments, support, fraud, and operational transaction costs scale with activity.",
        },

        {
          key:
            "marketing_ratio",

          label:
            "Growth marketing / revenue",

          value:
            0.35,

          unit:
            "%",

          area:
            "OPEX",

          rationale:
            "Two-sided network bootstrapping often requires meaningful acquisition investment.",
        },

        {
          key:
            "runway_target",

          label:
            "Runway target",

          value:
            18,

          unit:
            "months",

          area:
            "CASH",

          rationale:
            "Marketplace growth may require sustained investment before network effects mature.",
        },
      ],

      kpis: [
        "GMV",
        "Take rate",
        "Active buyers",
        "Active sellers",
        "Match / fill rate",
        "Transactions",
        "Repeat rate",
        "CAC",
        "Contribution margin",
      ],

      risks: [
        {
          title:
            "Marketplace liquidity",

          severity:
            "HIGH",

          watch:
            "Growth can stall if supply and demand do not scale together.",
        },

        {
          title:
            "Subsidized growth",

          severity:
            "HIGH",

          watch:
            "Incentives can create activity that disappears when subsidies end.",
        },

        {
          title:
            "Take-rate pressure",

          severity:
            "MEDIUM",

          watch:
            "Participants may resist monetization as the platform scales.",
        },
      ],

      managementQuestions: [
        "Is GMV growth translating into sustainable platform revenue?",
        "Are both marketplace sides improving together?",
        "Does cohort repeat behavior reduce acquisition dependency?",
        "What happens to liquidity if incentives are reduced?",
      ],
    },

    {
      id:
        "subscription-commerce",

      name:
        "Subscription Commerce",

      segment:
        "Subscription Consumer",

      description:
        "Physical subscription model combining recurring customer economics with product COGS, churn, fulfillment, and inventory requirements.",

      keywords: [
        "subscription box",
        "subscription commerce",
        "subscription product",
        "membership commerce",
        "recurring consumer",
        "monthly box",
      ],

      revenueModel:
        "CUSTOMER_DRIVEN",

      horizonGuidance:
        24,

      assumptions: [
        {
          key:
            "starting_subscribers",

          label:
            "Starting subscribers",

          value:
            1000,

          unit:
            "count",

          area:
            "REVENUE",

          rationale:
            "Defines the recurring installed subscriber base.",
        },

        {
          key:
            "monthly_price",

          label:
            "Monthly subscription price",

          value:
            45,

          unit:
            "currency",

          area:
            "REVENUE",

          rationale:
            "Primary recurring revenue driver.",
        },

        {
          key:
            "subscriber_growth",

          label:
            "Monthly subscriber growth",

          value:
            0.06,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "Separates subscriber acquisition from pricing.",
        },

        {
          key:
            "monthly_churn",

          label:
            "Monthly churn",

          value:
            0.05,

          unit:
            "%",

          area:
            "REVENUE",

          rationale:
            "Retention materially affects lifetime value and inventory planning.",
        },

        {
          key:
            "gross_margin",

          label:
            "Gross margin",

          value:
            0.42,

          unit:
            "%",

          area:
            "COGS",

          rationale:
            "Product, packaging, shipping, and fulfillment materially affect economics.",
        },

        {
          key:
            "inventory_buffer",

          label:
            "Inventory buffer",

          value:
            2,

          unit:
            "months",

          area:
            "CASH",

          rationale:
            "Recurring shipments create forward inventory commitments.",
        },
      ],

      kpis: [
        "Subscribers",
        "MRR",
        "Monthly churn",
        "Retention cohorts",
        "Gross margin",
        "CAC",
        "LTV",
        "Inventory coverage",
        "Contribution margin",
      ],

      risks: [
        {
          title:
            "Subscriber churn",

          severity:
            "HIGH",

          watch:
            "Acquisition spend can be wasted if retention is weak.",
        },

        {
          title:
            "Inventory mismatch",

          severity:
            "HIGH",

          watch:
            "Subscriber changes can leave excess or insufficient inventory.",
        },

        {
          title:
            "Fulfillment inflation",

          severity:
            "MEDIUM",

          watch:
            "Shipping and packaging pressure can reduce contribution margin.",
        },
      ],

      managementQuestions: [
        "Which cohorts retain best and why?",
        "Does lifetime value justify current acquisition spend?",
        "How much inventory is committed ahead of subscriber demand?",
        "Can price increases offset fulfillment inflation without increasing churn?",
      ],
    },

    {
      id:
        "local-retail",

      name:
        "Local Retail",

      segment:
        "Physical Retail",

      description:
        "Physical-store model centered on transaction volume, average ticket, gross margin, rent, staffing, seasonality, and cash reserve.",

      keywords: [
        "retail",
        "store",
        "shop",
        "boutique",
        "salon",
        "restaurant",
        "cafe",
        "local business",
        "physical store",
      ],

      revenueModel:
        "DIRECT",

      horizonGuidance:
        24,

      assumptions: [
        {
          key:
            "daily_transactions",

          label:
            "Daily transactions",

          value:
            80,

          unit:
            "count",

          area:
            "REVENUE",

          rationale:
            "Connects revenue to physical customer throughput.",
        },

        {
          key:
            "average_ticket",

          label:
            "Average ticket",

          value:
            35,

          unit:
            "currency",

          area:
            "REVENUE",

          rationale:
            "Separates footfall or transaction growth from pricing/mix.",
        },

        {
          key:
            "operating_days",

          label:
            "Operating days / month",

          value:
            26,

          unit:
            "days",

          area:
            "OPERATIONS",

          rationale:
            "Physical availability directly limits monthly transaction capacity.",
        },

        {
          key:
            "gross_margin",

          label:
            "Gross margin",

          value:
            0.55,

          unit:
            "%",

          area:
            "COGS",

          rationale:
            "Merchandise or service delivery economics determine contribution.",
        },

        {
          key:
            "rent_ratio",

          label:
            "Rent / revenue",

          value:
            0.10,

          unit:
            "%",

          area:
            "OPEX",

          rationale:
            "Occupancy is a major fixed-cost constraint for physical locations.",
        },

        {
          key:
            "payroll_ratio",

          label:
            "Payroll / revenue",

          value:
            0.28,

          unit:
            "%",

          area:
            "OPEX",

          rationale:
            "Staffing levels should be tested against transaction demand.",
        },

        {
          key:
            "cash_reserve",

          label:
            "Cash reserve",

          value:
            4,

          unit:
            "months",

          area:
            "CASH",

          rationale:
            "Provides resilience against seasonality and local demand shocks.",
        },
      ],

      kpis: [
        "Transactions",
        "Average ticket",
        "Revenue / operating day",
        "Gross margin",
        "Labor / revenue",
        "Rent / revenue",
        "Break-even transactions",
        "Cash balance",
      ],

      risks: [
        {
          title:
            "Fixed-cost exposure",

          severity:
            "HIGH",

          watch:
            "Rent and payroll continue even when traffic falls.",
        },

        {
          title:
            "Seasonality",

          severity:
            "MEDIUM",

          watch:
            "Monthly averages can hide peak and weak trading periods.",
        },

        {
          title:
            "Capacity constraint",

          severity:
            "MEDIUM",

          watch:
            "Revenue growth eventually requires more throughput, space, or labor.",
        },
      ],

      managementQuestions: [
        "How many daily transactions are required to break even?",
        "Can labor scheduling flex with demand?",
        "How sensitive cash is to a temporary footfall decline?",
        "Is the current location generating enough contribution to justify occupancy cost?",
      ],
    },
  ];


export const PLANNING_TEMPLATES:
  readonly PlanningTemplate[] =
    deepFreeze(
      templates,
    );


export function planningTemplateById(
  templateId:
    string,
): PlanningTemplate |
  null {
  return PLANNING_TEMPLATES.find(
    (
      template,
    ) =>
      template.id ===
      templateId,
  ) ??
  null;
}


export function planningTemplateSegments():
  string[] {
  return [
    ...new Set(
      PLANNING_TEMPLATES.map(
        (
          template,
        ) =>
          template.segment,
      ),
    ),
  ].sort();
}
