import type {
  ZodError,
} from "zod";

export type MonthlyOverrideActionState = {
  status?:
    | "success"
    | "error";

  message?: string;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export const initialMonthlyOverrideActionState: MonthlyOverrideActionState =
  {};

export function monthlyOverrideFieldErrors(
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
