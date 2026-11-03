/**
 * The biggest backup file the app accepts. Next.js refuses form uploads above
 * 1 MB, so the limit stays well below that. A normal model is a few kilobytes.
 */
export const MAX_BACKUP_BYTES = 400_000;

export const BACKUP_TOO_LARGE_MESSAGE =
  "This file is too large to be a VentureScope backup. Choose the file you downloaded from a model.";

export type ImportModelState = {
  message: string | null;
};

export const initialImportModelState: ImportModelState = {
  message: null,
};
