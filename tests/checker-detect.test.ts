import { describe, expect, it } from "bun:test";
import { analyze } from "../src/lib/checker/detect";
import {
  emptySnapshot,
  type Report,
  type Snapshot,
  type ToolName,
} from "../src/lib/checker/types";

const GTM_URL = "https://www.googletagmanager.com/gtm.js?id=GTM-WX9K2LP";
const GTAG_URL = "https://www.googletagmanager.com/gtag/js?id=G-8FQ2M1BZDR";
const GA_HIT =
  "https://region1.google-analytics.com/g/collect?v=2&tid=G-8FQ2M1BZDR&en=page_view";
const CLARITY_URL = "https://www.clarity.ms/tag/q4m2xk8p1v";
const CLARITY_HIT = "https://x.clarity.ms/collect";

function snap(overrides: Partial<Snapshot> = {}): Snapshot {
  return { ...emptySnapshot("https://acme.test/"), ...overrides };
}

function healthy(): Snapshot {
  return snap({
    resources: [GTM_URL, GTAG_URL, GA_HIT, CLARITY_URL, CLARITY_HIT],
    scriptSrcs: [GTM_URL, GTAG_URL, CLARITY_URL],
    dataLayer: [
      { "gtm.start": 1, event: "gtm.js" },
      ["consent", "default", { analytics_storage: "granted" }],
      ["config", "G-8FQ2M1BZDR"],
    ],
    gtmContainers: ["GTM-WX9K2LP"],
    hasGtag: true,
    hasClarity: true,
  });
}

function toolOf(report: Report, tool: ToolName) {
  const found = report.tools.find((entry) => entry.tool === tool);
  if (!found) throw new Error(`no report for ${tool}`);
  return found;
}

function titles(report: Report, tool: ToolName): string[] {
  return toolOf(report, tool).findings.map((finding) => finding.title);
}

describe("analyze — a correct install", () => {
  it("reports every tool as ok", () => {
    const report = analyze(healthy());
    expect(report.level).toBe("ok");
    expect(toolOf(report, "GTM").level).toBe("ok");
    expect(toolOf(report, "GA4").level).toBe("ok");
    expect(toolOf(report, "Clarity").level).toBe("ok");
  });

  it("extracts the container ids", () => {
    const report = analyze(healthy());
    expect(toolOf(report, "GTM").ids).toEqual(["GTM-WX9K2LP"]);
    expect(toolOf(report, "GA4").ids).toEqual(["G-8FQ2M1BZDR"]);
    expect(toolOf(report, "Clarity").ids).toEqual(["q4m2xk8p1v"]);
  });

  it("counts the beacons that actually fired", () => {
    const report = analyze(healthy());
    expect(toolOf(report, "GA4").hits).toBe(1);
    expect(toolOf(report, "Clarity").hits).toBe(1);
  });
});

describe("analyze — nothing installed", () => {
  it("errors on all three tools", () => {
    const report = analyze(snap());
    expect(report.level).toBe("error");
    expect(titles(report, "GTM")).toContain("No GTM container found");
    expect(titles(report, "GA4")).toContain("No GA4 tag found");
    expect(titles(report, "Clarity")).toContain("No Clarity tag found");
  });
});

describe("analyze — duplicate GA4", () => {
  it("errors when the same measurement id loads twice", () => {
    const base = healthy();
    const report = analyze({ ...base, resources: [...base.resources, GTAG_URL] });
    expect(toolOf(report, "GA4").level).toBe("error");
    expect(titles(report, "GA4")).toContain("Measured twice");
  });

  it("errors when GTM configures a property the page already configured", () => {
    const base = healthy();
    const report = analyze({
      ...base,
      dataLayer: [...base.dataLayer, ["config", "G-8FQ2M1BZDR"]],
    });
    expect(titles(report, "GA4")).toContain("Measured twice");
  });

  it("names the offending id and both counts", () => {
    const base = healthy();
    const report = analyze({ ...base, resources: [...base.resources, GTAG_URL] });
    const finding = toolOf(report, "GA4").findings.find(
      (f) => f.title === "Measured twice"
    );
    expect(finding?.detail).toContain("G-8FQ2M1BZDR");
    expect(finding?.detail).toContain("loaded 2x");
  });
});

describe("analyze — loaded versus fired", () => {
  it("warns when GA4 is present but sent no hit", () => {
    const base = healthy();
    const report = analyze({
      ...base,
      resources: base.resources.filter((url) => url !== GA_HIT),
    });
    expect(toolOf(report, "GA4").level).toBe("warn");
    expect(titles(report, "GA4")).toContain("No hit recorded yet");
  });

  it("warns when Clarity is present but uploaded nothing", () => {
    const base = healthy();
    const report = analyze({
      ...base,
      resources: base.resources.filter((url) => url !== CLARITY_HIT),
    });
    expect(titles(report, "Clarity")).toContain("No session data sent yet");
  });

  it("separates a blocked script from a missing one", () => {
    const base = healthy();
    const report = analyze({
      ...base,
      resources: base.resources.filter((url) => url !== GTAG_URL && url !== GA_HIT),
    });
    expect(titles(report, "GA4")).toContain("Tag script never loaded");
    expect(titles(report, "GA4")).not.toContain("No GA4 tag found");
  });
});

describe("analyze — GTM health", () => {
  it("warns when the container loads but never initialises", () => {
    const report = analyze({ ...healthy(), gtmContainers: [], dataLayer: [] });
    expect(titles(report, "GTM")).toContain("Container loaded but never initialised");
  });

  it("warns when two containers are present", () => {
    const base = healthy();
    const second = "https://www.googletagmanager.com/gtm.js?id=GTM-SECOND1";
    const report = analyze({
      ...base,
      resources: [...base.resources, second],
      scriptSrcs: [...base.scriptSrcs, second],
      gtmContainers: ["GTM-WX9K2LP", "GTM-SECOND1"],
    });
    expect(titles(report, "GTM")).toContain("Multiple GTM containers");
  });
});

describe("analyze — consent", () => {
  it("warns when analytics_storage is denied", () => {
    const base = healthy();
    const report = analyze({
      ...base,
      dataLayer: [
        ...base.dataLayer,
        ["consent", "update", { analytics_storage: "denied" }],
      ],
    });
    expect(report.consent.map((f) => f.title)).toContain("analytics_storage is denied");
    expect(report.level).toBe("warn");
  });

  it("stays quiet when the page uses no consent mode", () => {
    const report = analyze(snap());
    expect(report.consent).toEqual([]);
  });
});
