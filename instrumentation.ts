import {
  logStructured,
} from "@/lib/observability/logger";


export async function register() {
  if (
    process.env
      .NEXT_RUNTIME ===
    "nodejs"
  ) {
    const {
      registerNodeRuntimeInstrumentation,
    } =
      await import(
        "@/lib/observability/instrumentation-node"
      );


    registerNodeRuntimeInstrumentation();
  }
}


type RequestErrorContext = {
  path?:
    string;

  method?:
    string;
};


export function onRequestError(
  error:
    unknown,
  request:
    RequestErrorContext,
) {
  logStructured(
    "error",
    "runtime.request.error",
    {
      path:
        request?.path ??
        "unknown",

      method:
        request?.method ??
        "unknown",

      errorName:
        error instanceof Error
          ?
            error.name
          :
            "UnknownError",
    },
  );
}
