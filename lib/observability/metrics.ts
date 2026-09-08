export type RequestObservation = {
  route:
    string;

  status:
    number;

  durationMs:
    number;

  failed:
    boolean;
};


type MetricsStore = {
  startedAt:
    number;

  totalRequests:
    number;

  failedRequests:
    number;

  slowRequests:
    number;

  totalDurationMs:
    number;

  statuses:
    Record<
      string,
      number
    >;

  routes:
    Record<
      string,
      number
    >;
};


type ObservabilityGlobal = typeof globalThis & {
  __venturescopeObservabilityMetrics?:
    MetricsStore;
};


function createStore(): MetricsStore {
  return {
    startedAt:
      Date.now(),

    totalRequests:
      0,

    failedRequests:
      0,

    slowRequests:
      0,

    totalDurationMs:
      0,

    statuses:
      {},

    routes:
      {},
  };
}


function store(): MetricsStore {
  const root =
    globalThis as
      ObservabilityGlobal;


  root.__venturescopeObservabilityMetrics ??=
    createStore();


  return root.__venturescopeObservabilityMetrics;
}


export function getSlowRequestThresholdMs(): number {
  const parsed =
    Number.parseInt(
      process.env
        .VENTURESCOPE_SLOW_REQUEST_MS ??
      "",
      10,
    );


  if (
    !Number.isFinite(
      parsed,
    ) ||
    parsed <
      50 ||
    parsed >
      60_000
  ) {
    return 750;
  }


  return parsed;
}


export function recordRequestObservation(
  observation:
    RequestObservation,
): void {
  const metrics =
    store();


  metrics.totalRequests +=
    1;

  metrics.totalDurationMs +=
    observation
      .durationMs;


  if (
    observation.failed
  ) {
    metrics.failedRequests +=
      1;
  }


  if (
    observation.durationMs >=
    getSlowRequestThresholdMs()
  ) {
    metrics.slowRequests +=
      1;
  }


  const statusKey =
    String(
      observation
        .status,
    );


  metrics.statuses[
    statusKey
  ] =
    (
      metrics.statuses[
        statusKey
      ] ??
      0
    ) +
    1;


  metrics.routes[
    observation.route
  ] =
    (
      metrics.routes[
        observation.route
      ] ??
      0
    ) +
    1;
}


export function snapshotRequestMetrics() {
  const metrics =
    store();


  const averageDurationMs =
    metrics.totalRequests >
      0
      ?
        metrics.totalDurationMs /
        metrics.totalRequests
      :
        0;


  return {
    startedAt:
      new Date(
        metrics.startedAt,
      ).toISOString(),

    totalRequests:
      metrics.totalRequests,

    failedRequests:
      metrics.failedRequests,

    slowRequests:
      metrics.slowRequests,

    averageDurationMs:
      Math.round(
        averageDurationMs *
          100,
      ) /
      100,

    statuses: {
      ...metrics.statuses,
    },

    routes: {
      ...metrics.routes,
    },
  };
}


export function resetRequestMetricsForTests(): void {
  const root =
    globalThis as
      ObservabilityGlobal;


  root.__venturescopeObservabilityMetrics =
    createStore();
}
