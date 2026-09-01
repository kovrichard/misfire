import { describe, expect, it } from "bun:test";
import { analyze } from "../src/lib/checker/detect";
import { emptySnapshot, type Report, type Snapshot } from "../src/lib/checker/types";

const GTM_URL = "https://www.googletagmanager.com/gtm.js?id=GTM-WX9K2LP";
const GTAG_URL = "https://www.googletagmanager.com/gtag/js?id=G-8FQ2M1BZDR";
const GA_HIT =
  "https://region1.google-analytics.com/g/collect?v=2&tid=G-8FQ2M1BZDR&en=page_view";
const CLARITY_URL = "https://www.clarity.ms/tag/q4m2xk8p1v";
const CLARITY_HIT = "https://x.clarity.ms/collect";

function snap(overrides: Partial<Snapshot> = {}): Snapshot {
  return { ...emptySnapshot("https://acme.test/"), ...overrides };
}

function tag(src: string, data: Record<string, string> = {}) {
  return { src, data };
}

function healthy(): Snapshot {
  return snap({
    resources: [GTM_URL, GTAG_URL, GA_HIT, CLARITY_URL, CLARITY_HIT],
    scripts: [GTM_URL, GTAG_URL, CLARITY_URL].map((src) => tag(src)),
    dataLayer: [
      { "gtm.start": 1, event: "gtm.js" },
      ["consent", "default", { analytics_storage: "granted" }],
      ["config", "G-8FQ2M1BZDR"],
    ],
    gtmContainers: ["GTM-WX9K2LP"],
    globals: ["gtag", "clarity", "google_tag_manager"],
  });
}

function toolOf(report: Report, tool: string) {
  const found = report.tools.find((entry) => entry.tool === tool);
  if (!found) throw new Error(`no report for ${tool}`);
  return found;
}

function titles(report: Report, tool: string): string[] {
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
    const report = analyze({
      ...healthy(),
      gtmContainers: [],
      dataLayer: [],
      globals: ["gtag", "clarity"],
    });
    expect(titles(report, "GTM")).toContain("Container loaded but never initialised");
  });

  it("warns when two containers are present", () => {
    const base = healthy();
    const second = "https://www.googletagmanager.com/gtm.js?id=GTM-SECOND1";
    const report = analyze({
      ...base,
      resources: [...base.resources, second],
      scripts: [...base.scripts, tag(second)],
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

const PLAUSIBLE_JS = "https://plausible.io/js/script.js";
const PLAUSIBLE_HIT = "https://plausible.io/api/event";
const POSTHOG_JS = "https://us-assets.i.posthog.com/static/array.js";
const POSTHOG_HIT = "https://us.i.posthog.com/e/?ip=1";
const VERCEL_JS = "https://acme.test/_vercel/insights/script.js";
const VERCEL_HIT = "https://acme.test/_vercel/insights/view";
const META_JS = "https://connect.facebook.net/en_US/fbevents.js";
const META_HIT = "https://www.facebook.com/tr/?id=8891234&ev=PageView";
const HOTJAR_JS = "https://static.hotjar.com/c/hotjar-3456789.js";
const HOTJAR_HIT = "https://metrics.hotjar.io/api/v2/client/sites/3456789/hit";

describe("analyze — tools that are not installed", () => {
  it("does not add a row for a tool the page never used", () => {
    const names = analyze(healthy()).tools.map((tool) => tool.tool);
    expect(names).toEqual(["GTM", "GA4", "Clarity"]);
  });
});

describe("analyze — Plausible", () => {
  it("reads the site from data-domain and counts events", () => {
    const report = analyze(
      snap({
        resources: [PLAUSIBLE_JS, PLAUSIBLE_HIT],
        scripts: [tag(PLAUSIBLE_JS, { domain: "acme.com" })],
        globals: ["plausible"],
      })
    );
    const plausible = toolOf(report, "Plausible");
    expect(plausible.ids).toEqual(["acme.com"]);
    expect(plausible.hits).toBe(1);
    expect(plausible.level).toBe("ok");
  });

  it("errors when the script is in the page but never loaded", () => {
    const report = analyze(
      snap({ scripts: [tag(PLAUSIBLE_JS, { domain: "acme.com" })] })
    );
    expect(titles(report, "Plausible")).toContain("Tag script never loaded");
  });

  it("warns when it loaded but window.plausible never appeared", () => {
    const report = analyze(
      snap({ resources: [PLAUSIBLE_JS, PLAUSIBLE_HIT], scripts: [tag(PLAUSIBLE_JS)] })
    );
    expect(titles(report, "Plausible")).toContain(
      "Script loaded but window.plausible is missing"
    );
  });
});

describe("analyze — PostHog, Vercel and Hotjar", () => {
  it("detects PostHog and its capture endpoint", () => {
    const report = analyze(
      snap({ resources: [POSTHOG_JS, POSTHOG_HIT], globals: ["posthog"] })
    );
    expect(toolOf(report, "PostHog").hits).toBe(1);
    expect(toolOf(report, "PostHog").level).toBe("ok");
  });

  it("detects Vercel Analytics on its same-origin path", () => {
    const report = analyze(snap({ resources: [VERCEL_JS, VERCEL_HIT], globals: ["va"] }));
    expect(toolOf(report, "Vercel Analytics").hits).toBe(1);
  });

  it("reads the Hotjar site id out of the script url", () => {
    const report = analyze(snap({ resources: [HOTJAR_JS, HOTJAR_HIT], globals: ["hj"] }));
    expect(toolOf(report, "Hotjar").ids).toEqual(["3456789"]);
    expect(toolOf(report, "Hotjar").unit).toBe("upload");
  });
});

describe("analyze — Meta Pixel", () => {
  it("reads the pixel id from the fbq init queue", () => {
    const report = analyze(
      snap({
        resources: [META_JS, META_HIT],
        dataLayer: [["init", "8891234"]],
        globals: ["fbq"],
      })
    );
    expect(toolOf(report, "Meta Pixel").ids).toEqual(["8891234"]);
  });

  it("errors when the same pixel is initialised twice", () => {
    const report = analyze(
      snap({
        resources: [META_JS, META_HIT],
        dataLayer: [
          ["init", "8891234"],
          ["init", "8891234"],
        ],
        globals: ["fbq"],
      })
    );
    expect(titles(report, "Meta Pixel")).toContain("Initialised twice");
    expect(toolOf(report, "Meta Pixel").level).toBe("error");
  });
});

describe("analyze — consent platforms explain the silence", () => {
  const silent = () => {
    const base = healthy();
    return { ...base, resources: base.resources.filter((url) => url !== GA_HIT) };
  };

  it("names the CMP instead of shrugging", () => {
    const base = silent();
    const report = analyze({
      ...base,
      resources: [
        ...base.resources,
        "https://cdn.cookielaw.org/scripttemplates/otSDKStub.js",
      ],
      globals: [...base.globals, "OneTrust"],
    });
    const finding = toolOf(report, "GA4").findings.find(
      (f) => f.title === "No hit recorded yet"
    );
    expect(finding?.detail).toContain("OneTrust");
  });

  it("falls back to a generic reason when no CMP is present", () => {
    const finding = analyze(silent())
      .tools.find((tool) => tool.tool === "GA4")
      ?.findings.find((f) => f.title === "No hit recorded yet");
    expect(finding?.detail).toContain("Consent, a blocker, or a misconfigured ID");
  });

  it("prefers denied Consent Mode over naming the CMP", () => {
    const base = silent();
    const report = analyze({
      ...base,
      dataLayer: [
        ...base.dataLayer,
        ["consent", "update", { analytics_storage: "denied" }],
      ],
      globals: [...base.globals, "Cookiebot"],
    });
    const finding = toolOf(report, "GA4").findings.find(
      (f) => f.title === "No hit recorded yet"
    );
    expect(finding?.detail).toContain("analytics_storage denied");
  });

  it("recognises a bare TCF framework", () => {
    const base = silent();
    const report = analyze({ ...base, globals: [...base.globals, "__tcfapi"] });
    const finding = toolOf(report, "GA4").findings.find(
      (f) => f.title === "No hit recorded yet"
    );
    expect(finding?.detail).toContain("TCF");
  });
});

describe("analyze — unit labels", () => {
  it("keeps Clarity's unit on the not-installed path", () => {
    expect(toolOf(analyze(snap()), "Clarity").unit).toBe("upload");
  });

  it("gives GTM no unit, since it has no beacon of its own", () => {
    expect(toolOf(analyze(snap()), "GTM").unit).toBe("");
    expect(toolOf(analyze(healthy()), "GTM").unit).toBe("");
  });
});

describe("analyze — tool selection", () => {
  const names = (report: Report) => report.tools.map((tool) => tool.tool);

  it("does not report Google tools for someone who only picked Plausible", () => {
    const report = analyze(
      snap({
        resources: [PLAUSIBLE_JS, PLAUSIBLE_HIT],
        scripts: [tag(PLAUSIBLE_JS, { domain: "acme.com" })],
        globals: ["plausible"],
      }),
      ["plausible"]
    );
    expect(names(report)).toEqual(["Plausible"]);
    expect(report.level).toBe("ok");
  });

  it("errors on a picked tool that is not installed", () => {
    const report = analyze(snap(), ["plausible"]);
    expect(names(report)).toEqual(["Plausible"]);
    expect(titles(report, "Plausible")).toContain("No Plausible tag found");
    expect(report.level).toBe("error");
  });

  it("still lists an unpicked tool that is actually on the page", () => {
    const report = analyze(
      snap({
        resources: [POSTHOG_JS, POSTHOG_HIT, GTM_URL],
        scripts: [tag(GTM_URL)],
        gtmContainers: ["GTM-WX9K2LP"],
        dataLayer: [{ "gtm.start": 1, event: "gtm.js" }],
        globals: ["posthog", "google_tag_manager"],
      }),
      ["gtm"]
    );
    expect(names(report)).toEqual(["GTM", "PostHog"]);
  });

  it("falls back to the Google trio when nothing is passed", () => {
    expect(names(analyze(snap()))).toEqual(["GTM", "GA4", "Clarity"]);
  });

  it("falls back when an empty selection arrives", () => {
    expect(names(analyze(snap(), []))).toEqual(["GTM", "GA4", "Clarity"]);
  });
});

const META_PURCHASE = "https://www.facebook.com/tr/?id=8891234567890&ev=Purchase";
const VERCEL_DEBUG = "https://va.vercel-scripts.com/v1/script.debug.js";

describe("analyze — Meta event breakdown", () => {
  const withBeacons = (beacons: string[]) =>
    analyze(
      snap({
        resources: [META_JS, ...beacons],
        dataLayer: [["init", "8891234567890"]],
        globals: ["fbq"],
      })
    );

  it("names the events instead of only counting them", () => {
    const finding = toolOf(withBeacons([META_HIT]), "Meta Pixel").findings.find(
      (f) => f.title === "Sending data"
    );
    expect(finding?.detail).toContain("PageView");
  });

  it("summarises repeats", () => {
    const report = withBeacons([META_HIT, META_PURCHASE, META_PURCHASE]);
    const finding = toolOf(report, "Meta Pixel").findings.find(
      (f) => f.title === "Sending data"
    );
    expect(finding?.detail).toContain("PageView");
    expect(finding?.detail).toContain("Purchase x2");
  });

  it("warns when events fire but PageView never does", () => {
    const report = withBeacons([META_PURCHASE]);
    expect(titles(report, "Meta Pixel")).toContain("No PageView recorded");
    expect(toolOf(report, "Meta Pixel").level).toBe("warn");
  });

  it("stays quiet about PageView when nothing was sent at all", () => {
    const report = withBeacons([]);
    expect(titles(report, "Meta Pixel")).toContain("Nothing sent yet");
    expect(titles(report, "Meta Pixel")).not.toContain("No PageView recorded");
  });
});

describe("analyze — Vercel debug builds", () => {
  it("recognises the debug script and does not call it missing data", () => {
    const report = analyze(snap({ resources: [VERCEL_DEBUG], globals: ["va"] }));
    expect(titles(report, "Vercel Analytics")).toContain("Debug build in use");
    expect(titles(report, "Vercel Analytics")).not.toContain("Nothing sent yet");
  });

  it("still reports silence on a production build", () => {
    const report = analyze(snap({ resources: [VERCEL_JS], globals: ["va"] }));
    expect(titles(report, "Vercel Analytics")).toContain("Nothing sent yet");
    expect(titles(report, "Vercel Analytics")).not.toContain("Debug build in use");
  });
});

const DATAFAST_JS = "https://datafa.st/js/script.js";
const DATAFAST_HIT = "https://datafa.st/api/events";

describe("analyze — Datafast", () => {
  it("reads the site from data-website-id and counts events", () => {
    const report = analyze(
      snap({
        resources: [DATAFAST_JS, DATAFAST_HIT],
        scripts: [tag(DATAFAST_JS, { websiteId: "68b5c1f0a2" })],
        globals: ["datafast"],
      })
    );
    const datafast = toolOf(report, "Datafast");
    expect(datafast.ids).toEqual(["68b5c1f0a2"]);
    expect(datafast.hits).toBe(1);
    expect(datafast.level).toBe("ok");
  });

  it("warns when it loaded but window.datafast never appeared", () => {
    const report = analyze(
      snap({ resources: [DATAFAST_JS, DATAFAST_HIT], scripts: [tag(DATAFAST_JS)] })
    );
    expect(titles(report, "Datafast")).toContain(
      "Script loaded but window.datafast is missing"
    );
  });

  it("warns when the script is present but nothing was sent", () => {
    const report = analyze(
      snap({
        resources: [DATAFAST_JS],
        scripts: [tag(DATAFAST_JS)],
        globals: ["datafast"],
      })
    );
    expect(titles(report, "Datafast")).toContain("Nothing sent yet");
  });

  it("stays silent when unpicked and absent", () => {
    expect(analyze(snap()).tools.map((t) => t.tool)).not.toContain("Datafast");
  });

  it("errors when picked but absent", () => {
    const report = analyze(snap(), ["datafast"]);
    expect(titles(report, "Datafast")).toContain("No Datafast tag found");
  });
});

describe("analyze — vendors with colliding script paths", () => {
  it("does not report Plausible for a Datafast install", () => {
    const names = analyze(
      snap({
        resources: [DATAFAST_JS, DATAFAST_HIT],
        scripts: [tag(DATAFAST_JS, { websiteId: "68b5c1f0a2" })],
        globals: ["datafast"],
      })
    ).tools.map((tool) => tool.tool);
    expect(names).not.toContain("Plausible");
    expect(names).toContain("Datafast");
  });

  it("still recognises a proxied Plausible install", () => {
    const proxied = "https://acme.com/js/script.js";
    const names = analyze(
      snap({
        resources: [proxied, "https://acme.com/api/event"],
        scripts: [tag(proxied, { domain: "acme.com" })],
        globals: ["plausible"],
      })
    ).tools.map((tool) => tool.tool);
    expect(names).toContain("Plausible");
  });
});

const UMAMI_JS = "https://cloud.umami.is/script.js";
const UMAMI_HIT = "https://gateway.umami.is/api/send";
const UMAMI_SELF_JS = "https://stats.acme.com/umami.js";
const UMAMI_SELF_HIT = "https://stats.acme.com/api/send";

describe("analyze — Umami", () => {
  it("reads the site from data-website-id on the cloud script", () => {
    const report = analyze(
      snap({
        resources: [UMAMI_JS, UMAMI_HIT],
        scripts: [tag(UMAMI_JS, { websiteId: "3c8f2a11-77b0" })],
        globals: ["umami"],
      })
    );
    const umami = toolOf(report, "Umami");
    expect(umami.ids).toEqual(["3c8f2a11-77b0"]);
    expect(umami.hits).toBe(1);
    expect(umami.level).toBe("ok");
  });

  it("recognises a self-hosted install on its own domain", () => {
    const report = analyze(
      snap({
        resources: [UMAMI_SELF_JS, UMAMI_SELF_HIT],
        scripts: [tag(UMAMI_SELF_JS, { websiteId: "self-hosted-1" })],
        globals: ["umami"],
      })
    );
    expect(toolOf(report, "Umami").ids).toEqual(["self-hosted-1"]);
    expect(toolOf(report, "Umami").hits).toBe(1);
  });

  it("warns when it loaded but window.umami never appeared", () => {
    const report = analyze(
      snap({ resources: [UMAMI_JS, UMAMI_HIT], scripts: [tag(UMAMI_JS)] })
    );
    expect(titles(report, "Umami")).toContain(
      "Script loaded but window.umami is missing"
    );
  });

  it("warns when present but nothing was sent", () => {
    const report = analyze(
      snap({ resources: [UMAMI_JS], scripts: [tag(UMAMI_JS)], globals: ["umami"] })
    );
    expect(titles(report, "Umami")).toContain("Nothing sent yet");
  });

  it("errors when picked but absent", () => {
    expect(titles(analyze(snap(), ["umami"]), "Umami")).toContain("No Umami tag found");
  });
});

describe("analyze — the three data-website-id vendors stay apart", () => {
  const names = (report: Report) => report.tools.map((tool) => tool.tool);

  it("reports only Umami for an Umami install", () => {
    const found = names(
      analyze(
        snap({
          resources: [UMAMI_JS, UMAMI_HIT],
          scripts: [tag(UMAMI_JS, { websiteId: "u1" })],
          globals: ["umami"],
        })
      )
    );
    expect(found).toContain("Umami");
    expect(found).not.toContain("Datafast");
    expect(found).not.toContain("Plausible");
  });

  it("reports only Datafast for a Datafast install", () => {
    const found = names(
      analyze(
        snap({
          resources: [DATAFAST_JS, DATAFAST_HIT],
          scripts: [tag(DATAFAST_JS, { websiteId: "d1" })],
          globals: ["datafast"],
        })
      )
    );
    expect(found).toContain("Datafast");
    expect(found).not.toContain("Umami");
  });

  it("reports only Plausible for a proxied Plausible install", () => {
    const proxied = "https://acme.com/js/script.js";
    const found = names(
      analyze(
        snap({
          resources: [proxied, "https://acme.com/api/event"],
          scripts: [tag(proxied, { domain: "acme.com" })],
          globals: ["plausible"],
        })
      )
    );
    expect(found).toContain("Plausible");
    expect(found).not.toContain("Umami");
    expect(found).not.toContain("Datafast");
  });
});

describe("analyze — Umami self-hosted under the default filename", () => {
  const generic = "https://stats.acme.com/script.js";

  it("is found through the global and the send endpoint, without an id", () => {
    const umami = toolOf(
      analyze(
        snap({
          resources: [generic, "https://stats.acme.com/api/send"],
          scripts: [tag(generic, { websiteId: "x9" })],
          globals: ["umami"],
        })
      ),
      "Umami"
    );
    expect(umami.hits).toBe(1);
    expect(umami.ids).toEqual([]);
    expect(umami.level).toBe("ok");
  });

  it("does not claim a bare /script.js that has nothing to do with Umami", () => {
    const names = analyze(
      snap({ resources: [generic], scripts: [tag(generic)] })
    ).tools.map((tool) => tool.tool);
    expect(names).not.toContain("Umami");
  });
});
