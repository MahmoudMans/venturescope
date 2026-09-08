import type {
  ZodError,
} from "zod";

export type AssumptionActionState = {
  status?:
    | "success"
    | "error";

  message?: string;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export const initialAssumptionActionState: AssumptionActionState =
  {};

export function assumptionFieldErrors(
  error: ZodError,
): Record<
  string,
  string[] | undefined
> {
  return error.flatten()
    .fieldErrors as Record<
    string,
    string[] | undefined
  >;
}
