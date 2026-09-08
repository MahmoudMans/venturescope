import {
  z,
} from "zod";

function numericAdjustment(
  label: string,
  minimum: number,
  maximum: number,
) {
  return z
    .string()
    .trim()
    .min(
      1,
      `${label} is required.`,
    )
    .refine(
      (
        value,
      ) =>
        /^-?(?:\d+|\d+\.\d+|\.\d+)$/.test(
          value,
        ) &&
        Number.isFinite(
          Number(
            value,
          ),
        ),
      `${label} must be a valid number.`,
    )
    .refine(
      (
        value,
      ) =>
        Number(
          value,
        ) >=
        minimum,
      `${label} must be at least ${minimum}.`,
    )
    .refine(
      (
        value,
      ) =>
        Number(
          value,
        ) <=
        maximum,
      `${label} must not exceed ${maximum}.`,
    );
}

const projectId =
  z
    .string()
    .trim()
    .min(
      1,
      "Project identifier is required.",
    );

const scenarioId =
  z
    .string()
    .trim()
    .min(
      1,
      "Scenario identifier is required.",
    );

const scenarioName =
  z
    .string()
    .trim()
    .min(
      2,
      "Scenario name must contain at least 2 characters.",
    )
    .max(
      80,
      "Scenario name must contain at most 80 characters.",
    );

const modifierFields = {
  growthAdjustmentPercentage:
    numericAdjustment(
      "Growth adjustment",
      -100,
      500,
    ),

  arpuAdjustmentPercentage:
    numericAdjustment(
      "ARPU adjustment",
      -100,
      500,
    ),

  cacAdjustmentPercentage:
    numericAdjustment(
      "CAC adjustment",
      -99,
      500,
    ),

  churnDeltaPercentagePoints:
    numericAdjustment(
      "Churn adjustment",
      -100,
      100,
    ),

  cogsDeltaPercentagePoints:
    numericAdjustment(
      "COGS adjustment",
      -100,
      100,
    ),
};

export const createScenarioSchema =
  z.object({
    projectId,

    name:
      scenarioName,

    ...modifierFields,
  });

export const updateScenarioSchema =
  z.object({
    projectId,

    scenarioId,

    name:
      scenarioName,

    ...modifierFields,
  });

export const scenarioMutationIdentifierSchema =
  z.object({
    projectId,

    scenarioId,
  });
