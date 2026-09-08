import type {
  ZodError,
} from "zod";

export type FinancingActionState = {
  status?:
    | "success"
    | "error";

  message?: string;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export const initialFinancingActionState: FinancingActionState =
  {};

export function financingFieldErrors(
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
