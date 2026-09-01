export type Level = "ok" | "warn" | "error";

export type ToolKey =
  | "gtm"
  | "ga4"
  | "clarity"
  | "plausible"
  | "posthog"
  | "vercel"
  | "datafast"
  | "umami"
  | "googleads"
  | "meta"
  | "hotjar";

export interface ScriptTag {
  src: string;
  data: Record<string, string>;
}

export interface Snapshot {
  href: string;
  resources: string[];
  scripts: ScriptTag[];
  dataLayer: unknown[];
  gtmContainers: string[];
  globals: string[];
}

export interface Finding {
  level: Level;
  title: string;
  detail: string;
}

export interface ToolReport {
  tool: string;
  level: Level;
  ids: string[];
  hits: number;
  unit: string;
  findings: Finding[];
}

export interface Report {
  href: string;
  tools: ToolReport[];
  consent: Finding[];
  level: Level;
}

export function emptySnapshot(href = ""): Snapshot {
  return {
    href,
    resources: [],
    scripts: [],
    dataLayer: [],
    gtmContainers: [],
    globals: [],
  };
}

export function scriptSrcs(snapshot: Snapshot): string[] {
  return snapshot.scripts.map((script) => script.src);
}

export function hasGlobal(snapshot: Snapshot, name: string): boolean {
  return snapshot.globals.includes(name);
}
