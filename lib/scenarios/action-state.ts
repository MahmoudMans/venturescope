import type {
  ZodError,
} from "zod";

export type ScenarioActionState = {
  status?:
    | "success"
    | "error";

  message?: string;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export const initialScenarioActionState: ScenarioActionState =
  {};

export function scenarioFieldErrors(
  error: ZodError,
): Record<
  string,
  string[] | undefined
> {
  return error
    .flatten()
    .fieldErrors as Record<
      string,
      string[] | undefined
    >;
}
