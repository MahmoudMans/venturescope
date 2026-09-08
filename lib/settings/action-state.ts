import type {
  ZodError,
} from "zod";

export type ProjectSettingsActionState = {
  status?:
    | "success"
    | "error";

  message?: string;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export const initialProjectSettingsActionState: ProjectSettingsActionState =
  {};

export function projectSettingsFieldErrors(
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
