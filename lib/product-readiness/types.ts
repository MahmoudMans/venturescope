export type ProductCapabilityStatus =
  | "COMPLETE"
  | "FOUNDATION";


export type ProductCapability = {
  id:
    string;

  domain:
    string;

  title:
    string;

  summary:
    string;

  routeSuffix:
    string;

  status:
    ProductCapabilityStatus;

  evidence:
    readonly string[];
};


export type ProductGovernanceControl = {
  id:
    string;

  title:
    string;

  boundary:
    string;

  implementation:
    string;

  status:
    "ENFORCED";
};


export type PortfolioStoryboardItem = {
  id:
    string;

  order:
    number;

  title:
    string;

  routeSuffix:
    string;

  portfolioMessage:
    string;

  captureFocus:
    readonly string[];
};


export type FinalReleaseChecklistItem = {
  id:
    string;

  title:
    string;

  description:
    string;

  status:
    "READY";
};


export type ProductReadinessSummary = {
  capabilityCount:
    number;

  governanceControlCount:
    number;

  storyboardCount:
    number;

  migrationCount:
    number;

  releaseStageCount:
    number;

  paidApiCount:
    number;

  status:
    "FEATURE_COMPLETE";
};
