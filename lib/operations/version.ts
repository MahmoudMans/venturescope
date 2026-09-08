export const RELEASE_SERVICE =
  "venturescope";

export type ReleaseVersionPayload = {
  service:
    typeof RELEASE_SERVICE;

  version:
    string;

  environment:
    string;
};


export function normalizeReleaseVersion(
  value:
    string |
    null |
    undefined,
): string {
  const normalized =
    value?.trim();

  if (
    !normalized
  ) {
    return "development";
  }

  return normalized;
}


export function normalizeReleaseEnvironment(
  value:
    string |
    null |
    undefined,
): string {
  const normalized =
    value?.trim();

  if (
    !normalized
  ) {
    return "development";
  }

  return normalized;
}


export function buildReleaseVersionPayload(
  environment:
    NodeJS.ProcessEnv =
      process.env,
): ReleaseVersionPayload {
  return {
    service:
      RELEASE_SERVICE,

    version:
      normalizeReleaseVersion(
        environment
          .APP_VERSION,
      ),

    environment:
      normalizeReleaseEnvironment(
        environment
          .NODE_ENV,
      ),
  };
}
