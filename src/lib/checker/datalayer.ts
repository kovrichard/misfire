function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function gtagCalls(dataLayer: unknown[], command: string): unknown[][] {
  return dataLayer.filter(
    (entry): entry is unknown[] => Array.isArray(entry) && entry[0] === command
  );
}

export function configuredMeasurementIds(dataLayer: unknown[]): string[] {
  return gtagCalls(dataLayer, "config")
    .map((entry) => entry[1])
    .filter((id): id is string => typeof id === "string" && id.startsWith("G-"));
}

export function hasGtmInit(dataLayer: unknown[]): boolean {
  return dataLayer.some(
    (entry) => isRecord(entry) && (entry.event === "gtm.js" || "gtm.start" in entry)
  );
}

export function consentState(dataLayer: unknown[]): Record<string, string> {
  const state: Record<string, string> = {};
  for (const entry of gtagCalls(dataLayer, "consent")) {
    const payload = entry[2];
    if (!isRecord(payload)) continue;
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "string") state[key] = value;
    }
  }
  return state;
}
