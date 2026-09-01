export type Level = "ok" | "warn" | "error";

export type ToolName = "GTM" | "GA4" | "Clarity";

export interface Snapshot {
  href: string;
  resources: string[];
  scriptSrcs: string[];
  dataLayer: unknown[];
  gtmContainers: string[];
  hasGtag: boolean;
  hasClarity: boolean;
}

export interface Finding {
  level: Level;
  title: string;
  detail: string;
}

export interface ToolReport {
  tool: ToolName;
  level: Level;
  ids: string[];
  hits: number;
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
    scriptSrcs: [],
    dataLayer: [],
    gtmContainers: [],
    hasGtag: false,
    hasClarity: false,
  };
}
