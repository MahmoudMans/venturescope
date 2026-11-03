import { type FieldErrors, firstFieldError } from "@/lib/forms/field-errors";

/** The fields on step 1 of the new model wizard. Their messages show only while step 1 is open. */
export const WIZARD_STEP_ONE_FIELDS = [
  "name",
  "industry",
  "currency",
  "startMonth",
  "horizonMonths",
] as const;

/** True when the server sent back a message for a field on step 1. */
export function errorsBelongToStepOne(errors: FieldErrors): boolean {
  return WIZARD_STEP_ONE_FIELDS.some((field) => firstFieldError(errors, field) !== undefined);
}
