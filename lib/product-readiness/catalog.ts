import type {
  FinalReleaseChecklistItem,
  PortfolioStoryboardItem,
  ProductCapability,
  ProductGovernanceControl,
} from "@/lib/product-readiness/types";


export const FINAL_MIGRATION_COUNT =
  17;


export const FINAL_RELEASE_STAGE_COUNT =
  37;


export const PRODUCT_CAPABILITIES:
  readonly ProductCapability[] = [
    {
      id:
        "financial-model",

      domain:
        "Financial Modeling",

      title:
        "Deterministic Financial Model",

      summary:
        "Driver-based financial planning with revenue, costs, financing, scenarios, monthly overrides, and authoritative forecast exports.",

      routeSuffix:
        "/dashboard",

      status:
        "COMPLETE",

      evidence: [
        "Deterministic calculations",
        "No formula authority in UI",
        "Authenticated forecast export",
      ],
    },

    {
      id:
        "advanced-analytics",

      domain:
        "Financial Intelligence",

      title:
        "Advanced Analytics",

      summary:
        "DCF, sensitivity, unit economics, contribution economics, burn multiple, CAC payback, and Rule of 40 analysis.",

      routeSuffix:
        "/analytics",

      status:
        "COMPLETE",

      evidence: [
        "DCF",
        "Unit economics",
        "Operating metrics",
      ],
    },

    {
      id:
        "actuals",

      domain:
        "Performance Management",

      title:
        "Actuals & Variance",

      summary:
        "Monthly Actuals, forecast variance, historical forecast accuracy, and rolling planning-cycle baselines.",

      routeSuffix:
        "/actuals",

      status:
        "COMPLETE",

      evidence: [
        "Actual vs forecast",
        "Forecast accuracy",
        "Rolling reforecast",
      ],
    },

    {
      id:
        "risk-capital",

      domain:
        "Risk & Treasury",

      title:
        "Liquidity Risk & Capital Planning",

      summary:
        "Liquidity guardrails, downside cash stress, funding requirement analysis, debt modeling, and dilution planning.",

      routeSuffix:
        "/risk-center",

      status:
        "COMPLETE",

      evidence: [
        "Liquidity risk scoring",
        "Downside shocks",
        "Capital requirement",
      ],
    },

    {
      id:
        "scenario-intelligence",

      domain:
        "Decision Intelligence",

      title:
        "Scenario & Sensitivity Intelligence",

      summary:
        "Scenario comparison, immutable version differences, and deterministic revenue/cost stress surfaces.",

      routeSuffix:
        "/scenario-comparison",

      status:
        "COMPLETE",

      evidence: [
        "Scenario decision matrix",
        "Version diff",
        "Sensitivity lab",
      ],
    },

    {
      id:
        "management-scorecard",

      domain:
        "Performance Management",

      title:
        "Management Scorecard",

      summary:
        "KPI targets, target health, management variance explanations, root causes, and corrective-action tracking.",

      routeSuffix:
        "/scorecard",

      status:
        "COMPLETE",

      evidence: [
        "KPI target health",
        "Variance commentary",
        "Management accountability",
      ],
    },

    {
      id:
        "governance",

      domain:
        "Governance",

      title:
        "Financial Governance",

      summary:
        "Formal decisions, approval workflows, financial period locking, requester/approver separation, and immutable audit evidence.",

      routeSuffix:
        "/approvals",

      status:
        "COMPLETE",

      evidence: [
        "Approval workflow",
        "Financial Close",
        "Audit ledger",
      ],
    },

    {
      id:
        "executive-reporting",

      domain:
        "Executive Reporting",

      title:
        "Board & Executive Reporting",

      summary:
        "Frozen executive reviews, Board Room comparisons, Board Pack composition, and management action registers.",

      routeSuffix:
        "/board-pack",

      status:
        "COMPLETE",

      evidence: [
        "Board Pack",
        "Executive snapshots",
        "Decision Center",
      ],
    },

    {
      id:
        "collaboration",

      domain:
        "Collaboration",

      title:
        "Workspace Collaboration",

      summary:
        "Workspace ownership, Editor and Viewer roles, invitations, project-scoped access, and collaborative governance.",

      routeSuffix:
        "/settings",

      status:
        "COMPLETE",

      evidence: [
        "OWNER / EDITOR / VIEWER",
        "Workspace membership",
        "Project-scoped authorization",
      ],
    },

    {
      id:
        "alerts",

      domain:
        "Operational Intelligence",

      title:
        "Alert Inbox",

      summary:
        "Current-state financial and governance alerts with personal read, dismiss, snooze, and fingerprint-based reactivation.",

      routeSuffix:
        "/alerts",

      status:
        "COMPLETE",

      evidence: [
        "Financial exception alerts",
        "Personal receipt state",
        "Changed-alert reactivation",
      ],
    },

    {
      id:
        "imports",

      domain:
        "Data Operations",

      title:
        "Governed Data Import",

      summary:
        "Preview, validation, explicit application, atomic CSV writes, import history, and Financial Close protection.",

      routeSuffix:
        "/imports",

      status:
        "COMPLETE",

      evidence: [
        "Actuals import",
        "KPI import",
        "Variance commentary import",
      ],
    },

    {
      id:
        "portfolio",

      domain:
        "Portfolio Management",

      title:
        "Multi-Project Portfolio",

      summary:
        "Cross-project risk, readiness, actions, scorecards, liquidity, and capital visibility across accessible workspaces.",

      routeSuffix:
        "/portfolio",

      status:
        "COMPLETE",

      evidence: [
        "Portfolio attention scoring",
        "Cross-project actions",
        "Currency isolation",
      ],
    },

    {
      id:
        "templates",

      domain:
        "Planning Intelligence",

      title:
        "Industry Planning Templates",

      summary:
        "Immutable planning references for SaaS, commerce, services, marketplaces, subscriptions, and local retail.",

      routeSuffix:
        "/templates",

      status:
        "COMPLETE",

      evidence: [
        "Industry matching",
        "Template comparison",
        "Planning briefs",
      ],
    },

    {
      id:
        "consolidation",

      domain:
        "Consolidated Reporting",

      title:
        "Multi-Currency Consolidation",

      summary:
        "Workspace reporting currency, dated manual FX governance, source provenance, and controlled cross-currency consolidation.",

      routeSuffix:
        "/consolidation",

      status:
        "COMPLETE",

      evidence: [
        "Direct FX",
        "Inverse FX",
        "Missing-rate transparency",
      ],
    },

    {
      id:
        "production",

      domain:
        "Production Engineering",

      title:
        "Production Hardening",

      summary:
        "Security headers, account/session lifecycle, observability, diagnostics, deployment/rollback operations, accessibility, and comprehensive release gates.",

      routeSuffix:
        "/activity",

      status:
        "COMPLETE",

      evidence: [
        "Security hardening",
        "Observability",
        "Production release gate",
      ],
    },
  ];


export const PRODUCT_GOVERNANCE_CONTROLS:
  readonly ProductGovernanceControl[] = [
    {
      id:
        "project-access",

      title:
        "Project-scoped authorization",

      boundary:
        "Every private project surface requires authenticated collaborative project access.",

      implementation:
        "Project-access authority and workspace membership checks.",

      status:
        "ENFORCED",
    },

    {
      id:
        "role-boundaries",

      title:
        "OWNER / EDITOR / VIEWER separation",

      boundary:
        "Read and mutation privileges are separated according to workspace role.",

      implementation:
        "Dedicated read, Editor, and Workspace Owner authorities.",

      status:
        "ENFORCED",
    },

    {
      id:
        "finance-authority",

      title:
        "Financial calculation authority",

      boundary:
        "Financial formulas remain in finance libraries rather than duplicated across user-interface components.",

      implementation:
        "Shared deterministic finance engines.",

      status:
        "ENFORCED",
    },

    {
      id:
        "closed-period",

      title:
        "Closed-period Actuals protection",

      boundary:
        "CLOSED financial periods reject Actual inserts, updates, and deletes.",

      implementation:
        "PostgreSQL Financial Close trigger.",

      status:
        "ENFORCED",
    },

    {
      id:
        "audit",

      title:
        "Immutable audit evidence",

      boundary:
        "Material governance events cannot be edited or deleted after creation.",

      implementation:
        "ProjectAuditEvent immutable PostgreSQL guard.",

      status:
        "ENFORCED",
    },

    {
      id:
        "approval-separation",

      title:
        "Approval separation of duties",

      boundary:
        "A requester cannot approve or reject their own governance request.",

      implementation:
        "Owner authorization plus requester/approver identity validation.",

      status:
        "ENFORCED",
    },

    {
      id:
        "import-atomicity",

      title:
        "Atomic governed imports",

      boundary:
        "Business-data imports either apply as an atomic operation or fail without partial business-data state.",

      implementation:
        "Validated Prisma transactions plus import history.",

      status:
        "ENFORCED",
    },

    {
      id:
        "alert-isolation",

      title:
        "Personal alert state",

      boundary:
        "Read, snooze, and dismiss state belongs to the authenticated user and does not resolve business issues.",

      implementation:
        "User/project/alert-key scoped receipt persistence.",

      status:
        "ENFORCED",
    },

    {
      id:
        "currency",

      title:
        "Governed currency conversion",

      boundary:
        "Cross-currency totals require an explicit eligible workspace FX rate.",

      implementation:
        "Manual dated direct/inverse FX authority with provenance.",

      status:
        "ENFORCED",
    },

    {
      id:
        "no-paid-api",

      title:
        "No paid external business API",

      boundary:
        "Core product functionality does not depend on paid data, AI, notification, import, or FX providers.",

      implementation:
        "Local deterministic engines and user-governed inputs.",

      status:
        "ENFORCED",
    },

    {
      id:
        "release-gate",

      title:
        "Authoritative release verification",

      boundary:
        "A release is accepted only after the complete product quality gate passes.",

      implementation:
        "37-stage final release gate covering tests, build, browser security, migration integrity, and production Docker.",

      status:
        "ENFORCED",
    },
  ];


export const PORTFOLIO_STORYBOARD:
  readonly PortfolioStoryboardItem[] = [
    {
      id:
        "executive-dashboard",

      order:
        1,

      title:
        "Executive financial overview",

      routeSuffix:
        "/dashboard",

      portfolioMessage:
        "Show that VentureScope turns operating assumptions into an executive financial view.",

      captureFocus: [
        "Revenue",
        "EBITDA",
        "Cash",
        "Runway",
      ],
    },

    {
      id:
        "risk",

      order:
        2,

      title:
        "Liquidity risk intelligence",

      routeSuffix:
        "/risk-center",

      portfolioMessage:
        "Show downside-aware liquidity monitoring and financial guardrails.",

      captureFocus: [
        "Risk score",
        "Minimum cash",
        "Downside case",
        "Guardrails",
      ],
    },

    {
      id:
        "scenario",

      order:
        3,

      title:
        "Scenario decision intelligence",

      routeSuffix:
        "/scenario-comparison",

      portfolioMessage:
        "Show structured comparison between Base, Bull, Bear, and custom planning cases.",

      captureFocus: [
        "Scenario matrix",
        "Cash outcome",
        "Profitability",
        "Decision signals",
      ],
    },

    {
      id:
        "board",

      order:
        4,

      title:
        "Board reporting",

      routeSuffix:
        "/board-pack",

      portfolioMessage:
        "Show the executive reporting layer built on top of the same financial authorities.",

      captureFocus: [
        "Executive summary",
        "Financial KPIs",
        "Actions",
        "Governance",
      ],
    },

    {
      id:
        "portfolio",

      order:
        5,

      title:
        "Multi-project portfolio management",

      routeSuffix:
        "/portfolio",

      portfolioMessage:
        "Show cross-project risk, forecast readiness, management attention, and action tracking.",

      captureFocus: [
        "Project ranking",
        "Risk distribution",
        "Action register",
        "Currency separation",
      ],
    },

    {
      id:
        "governance",

      order:
        6,

      title:
        "Approval and governance workflows",

      routeSuffix:
        "/approvals",

      portfolioMessage:
        "Show enterprise-style requester/approver separation and auditable decisions.",

      captureFocus: [
        "Pending approvals",
        "Owner decision",
        "Decision rationale",
        "Auditability",
      ],
    },

    {
      id:
        "data",

      order:
        7,

      title:
        "Governed data operations",

      routeSuffix:
        "/imports",

      portfolioMessage:
        "Show safe CSV preview, validation, explicit apply, and import evidence.",

      captureFocus: [
        "CSV preview",
        "Validation",
        "Import history",
        "Financial Close protection",
      ],
    },

    {
      id:
        "consolidation",

      order:
        8,

      title:
        "Multi-currency consolidation",

      routeSuffix:
        "/consolidation",

      portfolioMessage:
        "Show controlled portfolio consolidation with manual dated FX provenance.",

      captureFocus: [
        "Reporting currency",
        "FX provenance",
        "Consolidated cash",
        "Missing-rate transparency",
      ],
    },

    {
      id:
        "readiness",

      order:
        9,

      title:
        "Release readiness",

      routeSuffix:
        "/release-readiness",

      portfolioMessage:
        "Finish the portfolio story with architecture, governance, quality, and production-readiness evidence.",

      captureFocus: [
        "Capability map",
        "Governance controls",
        "Release gate",
        "Portfolio storyboard",
      ],
    },
  ];


export const FINAL_RELEASE_CHECKLIST:
  readonly FinalReleaseChecklistItem[] = [
    {
      id:
        "financial-integrity",

      title:
        "Financial authority remains centralized",

      description:
        "No final-release UI introduces a second financial engine.",

      status:
        "READY",
    },

    {
      id:
        "security",

      title:
        "Private surfaces retain authenticated access",

      description:
        "Project workspaces remain protected by existing authentication and authorization boundaries.",

      status:
        "READY",
    },

    {
      id:
        "migration",

      title:
        "Migration chain remains reproducible",

      description:
        "All 17 migrations must deploy from an empty PostgreSQL database with zero Prisma drift.",

      status:
        "READY",
    },

    {
      id:
        "testing",

      title:
        "Full automated test estate",

      description:
        "Unit, contract, security-source, accessibility, and browser tests remain authoritative.",

      status:
        "READY",
    },

    {
      id:
        "production-build",

      title:
        "Production build",

      description:
        "The final Next.js application must compile successfully under the authoritative release gate.",

      status:
        "READY",
    },

    {
      id:
        "production-container",

      title:
        "Production container",

      description:
        "Production Docker build and Compose runtime remain part of release verification.",

      status:
        "READY",
    },

    {
      id:
        "portfolio",

      title:
        "Portfolio story",

      description:
        "Nine intentionally selected product surfaces communicate the application story without requiring a live stakeholder walkthrough.",

      status:
        "READY",
    },

    {
      id:
        "commercial-dependencies",

      title:
        "No paid application dependency",

      description:
        "Core portfolio demonstration remains functional without a paid API or subscription.",

      status:
        "READY",
    },
  ];
