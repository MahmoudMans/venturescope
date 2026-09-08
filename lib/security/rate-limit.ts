type RateLimitBucket = {
  count: number;

  resetAt: number;
};

type RateLimitStore = {
  buckets:
    Map<
      string,
      RateLimitBucket
    >;
};

const globalRateLimit =
  globalThis as unknown as {
    venturescopeRateLimit?:
      RateLimitStore;
  };

const store =
  globalRateLimit
    .venturescopeRateLimit ??
  {
    buckets:
      new Map(),
  };

globalRateLimit.venturescopeRateLimit =
  store;

export type RateLimitResult = {
  allowed: boolean;

  remaining: number;

  retryAfterSeconds: number;

  resetAt: number;
};

function pruneExpired(
  now: number,
): void {
  if (
    store.buckets.size <
    5000
  ) {
    return;
  }

  for (
    const [
      key,
      bucket,
    ]
    of store.buckets
  ) {
    if (
      bucket.resetAt <=
      now
    ) {
      store.buckets.delete(
        key,
      );
    }
  }
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: {
  key: string;

  limit: number;

  windowMs: number;

  now?: number;
}): RateLimitResult {
  pruneExpired(
    now,
  );

  const existing =
    store.buckets.get(
      key,
    );

  if (
    !existing ||
    existing.resetAt <=
      now
  ) {
    const next = {
      count:
        1,

      resetAt:
        now +
        windowMs,
    };

    store.buckets.set(
      key,
      next,
    );

    return {
      allowed:
        true,

      remaining:
        Math.max(
          0,
          limit -
          1,
        ),

      retryAfterSeconds:
        Math.ceil(
          windowMs /
          1000,
        ),

      resetAt:
        next.resetAt,
    };
  }

  if (
    existing.count >=
    limit
  ) {
    return {
      allowed:
        false,

      remaining:
        0,

      retryAfterSeconds:
        Math.max(
          1,
          Math.ceil(
            (
              existing.resetAt -
              now
            ) /
            1000,
          ),
        ),

      resetAt:
        existing.resetAt,
    };
  }

  existing.count +=
    1;

  store.buckets.set(
    key,
    existing,
  );

  return {
    allowed:
      true,

    remaining:
      Math.max(
        0,
        limit -
        existing.count,
      ),

    retryAfterSeconds:
      Math.max(
        1,
        Math.ceil(
          (
            existing.resetAt -
            now
          ) /
          1000,
        ),
      ),

    resetAt:
      existing.resetAt,
  };
}

export function resetRateLimitStoreForTests(): void {
  store.buckets.clear();
}
