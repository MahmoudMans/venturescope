import {
  FINAL_MIGRATION_COUNT,
  FINAL_RELEASE_CHECKLIST,
  FINAL_RELEASE_STAGE_COUNT,
  PORTFOLIO_STORYBOARD,
  PRODUCT_CAPABILITIES,
  PRODUCT_GOVERNANCE_CONTROLS,
} from "@/lib/product-readiness/catalog";

import type {
  ProductReadinessSummary,
} from "@/lib/product-readiness/types";


export function buildProductReadinessSummary():
  ProductReadinessSummary {
  const featureComplete =
    PRODUCT_CAPABILITIES.every(
      (
        capability,
      ) =>
        capability.status ===
          "COMPLETE" ||
        capability.status ===
          "FOUNDATION",
    );


  const governanceComplete =
    PRODUCT_GOVERNANCE_CONTROLS.every(
      (
        control,
      ) =>
        control.status ===
        "ENFORCED",
    );


  const checklistComplete =
    FINAL_RELEASE_CHECKLIST.every(
      (
        item,
      ) =>
        item.status ===
        "READY",
    );


  if (
    !featureComplete ||
    !governanceComplete ||
    !checklistComplete
  ) {
    throw new Error(
      "Product readiness catalog contains an incomplete final-release item.",
    );
  }


  return {
    capabilityCount:
      PRODUCT_CAPABILITIES.length,

    governanceControlCount:
      PRODUCT_GOVERNANCE_CONTROLS.length,

    storyboardCount:
      PORTFOLIO_STORYBOARD.length,

    migrationCount:
      FINAL_MIGRATION_COUNT,

    releaseStageCount:
      FINAL_RELEASE_STAGE_COUNT,

    paidApiCount:
      0,

    status:
      "FEATURE_COMPLETE",
  };
}
