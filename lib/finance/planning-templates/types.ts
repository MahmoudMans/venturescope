export type PlanningTemplateRevenueModel =
  | "CUSTOMER_DRIVEN"
  | "DIRECT"
  | "MARKETPLACE"
  | "HYBRID";


export type PlanningTemplateAssumptionArea =
  | "REVENUE"
  | "COGS"
  | "OPEX"
  | "CASH"
  | "OPERATIONS";


export type PlanningTemplateAssumption = {
  key:
    string;

  label:
    string;

  value:
    number |
    string;

  unit:
    "%" |
    "currency" |
    "count" |
    "months" |
    "days" |
    "x" |
    "text";

  area:
    PlanningTemplateAssumptionArea;

  rationale:
    string;
};


export type PlanningTemplateRisk = {
  title:
    string;

  severity:
    "HIGH" |
    "MEDIUM" |
    "LOW";

  watch:
    string;
};


export type PlanningTemplate = {
  id:
    string;

  name:
    string;

  segment:
    string;

  description:
    string;

  keywords:
    readonly string[];

  revenueModel:
    PlanningTemplateRevenueModel;

  horizonGuidance:
    number;

  assumptions:
    readonly PlanningTemplateAssumption[];

  kpis:
    readonly string[];

  risks:
    readonly PlanningTemplateRisk[];

  managementQuestions:
    readonly string[];
};


export type PlanningTemplateFit =
  | "RECOMMENDED"
  | "POSSIBLE"
  | "EXPLORATORY";


export type PlanningTemplateMatch = {
  template:
    PlanningTemplate;

  score:
    number;

  fit:
    PlanningTemplateFit;

  reasons:
    string[];
};


export type PlanningTemplateComparisonRow = {
  key:
    string;

  label:
    string;

  area:
    PlanningTemplateAssumptionArea;

  left:
    PlanningTemplateAssumption |
    null;

  right:
    PlanningTemplateAssumption |
    null;
};


export type PlanningTemplateBrief = {
  templateId:
    string;

  title:
    string;

  revenueFocus:
    string;

  operatingFocus:
    string;

  liquidityFocus:
    string;

  kpiFocus:
    string;

  riskFocus:
    string;
};
