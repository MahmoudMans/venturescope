import {
  logStructured,
} from "@/lib/observability/logger";


export function registerNodeRuntimeInstrumentation(): void {
  logStructured(
    "info",
    "runtime.start",
    {
      nodeVersion:
        process.versions
          .node,

      pid:
        process.pid,

      uptimeSeconds:
        Math.round(
          process.uptime() *
            100,
        ) /
        100,
    },
  );
}
