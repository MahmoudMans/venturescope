export type ModelNotice = {
  tone: "success" | "error" | "info";

  message: string;
};

/**
 * The dashboard is opened with "?status=..." after a model was deleted, renamed or could not be
 * copied. Any other value, and a value that is repeated in the address, shows nothing.
 */
export function getModelNotice(code: string | string[] | undefined): ModelNotice | null {
  switch (code) {
    case "model-deleted":
      return {
        tone: "success",

        message: "The model was deleted.",
      };

    case "model-renamed":
      return {
        tone: "success",

        message: "The model was renamed.",
      };

    case "model-missing":
      return {
        tone: "info",

        message: "That model was not found. It may already be deleted.",
      };

    case "delete-failed":
      return {
        tone: "error",

        message: "We could not delete the model. Nothing was changed, so you can try again.",
      };

    case "copy-failed":
      return {
        tone: "error",

        message: "We could not copy the model. Nothing was saved, so you can try again.",
      };

    default:
      return null;
  }
}
