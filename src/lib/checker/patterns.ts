export const GTM_SCRIPT =
  /googletagmanager\.com\/gtm\.js\?[^\s"']*?\bid=(GTM-[A-Z0-9]+)/i;
export const GTM_FRAME =
  /googletagmanager\.com\/ns\.html\?[^\s"']*?\bid=(GTM-[A-Z0-9]+)/i;
export const GTAG_SCRIPT =
  /googletagmanager\.com\/gtag\/js\?[^\s"']*?\bid=(G-[A-Z0-9]+)/i;
export const GA_COLLECT =
  /(google-analytics\.com|analytics\.google\.com)\/[a-z]\/collect/i;
export const GA4_COLLECT_PATH = /\/g\/collect/i;
export const CLARITY_TAG = /clarity\.ms\/tag\/([a-z0-9]+)/i;
export const CLARITY_COLLECT = /clarity\.ms\/collect/i;

export function captureAll(values: string[], pattern: RegExp): string[] {
  const captured: string[] = [];
  for (const value of values) {
    const match = pattern.exec(value);
    if (match?.[1]) captured.push(match[1]);
  }
  return captured;
}

export function matching(values: string[], pattern: RegExp): string[] {
  return values.filter((value) => pattern.test(value));
}

export function queryParam(url: string, key: string): string | null {
  try {
    return new URL(url).searchParams.get(key);
  } catch {
    return null;
  }
}

export function tally(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

export function unique(values: string[]): string[] {
  return [...new Set(values)];
}
