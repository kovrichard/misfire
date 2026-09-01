import { configuredMeasurementIds, consentState, hasGtmInit } from "./datalayer";
import {
  CLARITY_COLLECT,
  CLARITY_TAG,
  captureAll,
  GA_COLLECT,
  GTAG_SCRIPT,
  GTM_FRAME,
  GTM_SCRIPT,
  matching,
  queryParam,
  tally,
  unique,
} from "./patterns";
import {
  CMP_SPECS,
  DEFAULT_TOOLS,
  idsFromScripts,
  TOOL_SPECS,
  type ToolSpec,
} from "./registry";
import {
  type Finding,
  hasGlobal,
  type Level,
  type Report,
  type Snapshot,
  scriptSrcs,
  type ToolKey,
  type ToolReport,
} from "./types";

const ok = (title: string, detail: string): Finding => ({ level: "ok", title, detail });
const warn = (title: string, detail: string): Finding => ({
  level: "warn",
  title,
  detail,
});
const bad = (title: string, detail: string): Finding => ({
  level: "error",
  title,
  detail,
});

const RANK: Record<Level, number> = { ok: 0, warn: 1, error: 2 };

function worst(findings: Finding[]): Level {
  return findings.reduce<Level>(
    (level, finding) => (RANK[finding.level] > RANK[level] ? finding.level : level),
    "ok"
  );
}

function report(
  tool: string,
  ids: string[],
  hits: number,
  findings: Finding[],
  unit = "hit"
): ToolReport {
  return { tool, ids, hits, unit, findings, level: worst(findings) };
}

function plural(count: number, unit: string): string {
  return count === 1 ? `1 ${unit}` : `${count} ${unit}s`;
}

function detectGtm(snapshot: Snapshot, required: boolean): ToolReport | null {
  const loaded = captureAll(snapshot.resources, GTM_SCRIPT);
  const framed = captureAll(snapshot.resources, GTM_FRAME);
  const declared = captureAll(scriptSrcs(snapshot), GTM_SCRIPT);
  const ids = unique([...loaded, ...framed, ...snapshot.gtmContainers, ...declared]);
  const findings: Finding[] = [];

  if (ids.length === 0) {
    if (!required) return null;
    findings.push(
      bad("No GTM container found", "No gtm.js request and no window.google_tag_manager.")
    );
    return report("GTM", ids, 0, findings, "");
  }

  const blocked = declared.filter((id) => !loaded.includes(id));
  if (blocked.length > 0) {
    findings.push(
      bad(
        "Container script never loaded",
        `${blocked.join(", ")} is in the page but made no request — blocked by CSP, an extension, or a 404.`
      )
    );
  }

  const initialised = unique(snapshot.gtmContainers);
  const inert = ids.filter((id) => !initialised.includes(id));
  if (initialised.length === 0) {
    findings.push(
      warn(
        "Container loaded but never initialised",
        "window.google_tag_manager is empty — the container script ran without booting."
      )
    );
  } else if (inert.length > 0) {
    findings.push(
      warn("Some containers did not initialise", `Still inert: ${inert.join(", ")}.`)
    );
  }

  if (!hasGtmInit(snapshot.dataLayer)) {
    findings.push(
      warn("No gtm.js event in dataLayer", "The container never pushed its start event.")
    );
  }

  if (ids.length > 1) {
    findings.push(
      warn(
        "Multiple GTM containers",
        `${ids.join(", ")} are all present — tags may fire more than once.`
      )
    );
  }

  if (findings.length === 0) {
    findings.push(ok("Container live", `${ids.join(", ")} loaded and initialised.`));
  }

  return report("GTM", ids, 0, findings, "");
}

function detectGa4(
  snapshot: Snapshot,
  blocker: string | null,
  required: boolean
): ToolReport | null {
  const loads = captureAll(snapshot.resources, GTAG_SCRIPT);
  const declared = captureAll(scriptSrcs(snapshot), GTAG_SCRIPT);
  const configs = configuredMeasurementIds(snapshot.dataLayer);
  const beacons = matching(snapshot.resources, GA_COLLECT);
  const measured = beacons
    .map((url) => queryParam(url, "tid"))
    .filter((id): id is string => id !== null);
  const ids = unique([...loads, ...configs, ...declared, ...measured]);
  const findings: Finding[] = [];

  if (ids.length === 0) {
    if (!required) return null;
    findings.push(
      bad(
        "No GA4 tag found",
        "No gtag/js request, no config call, and no collect beacon on this page."
      )
    );
    return report("GA4", ids, 0, findings);
  }

  const loadCounts = tally(loads);
  const configCounts = tally(configs);
  for (const id of ids) {
    const scriptLoads = loadCounts.get(id) ?? 0;
    const configCalls = configCounts.get(id) ?? 0;
    if (scriptLoads > 1 || configCalls > 1) {
      const counts: string[] = [];
      if (scriptLoads > 0) counts.push(`loaded ${scriptLoads}x`);
      if (configCalls > 0) counts.push(`configured ${configCalls}x`);
      findings.push(
        bad(
          "Measured twice",
          `${id} was ${counts.join(" and ")} — every session is counted double.`
        )
      );
    }
  }

  const blocked = declared.filter((id) => !loads.includes(id));
  if (blocked.length > 0) {
    findings.push(
      bad(
        "Tag script never loaded",
        `${blocked.join(", ")} is in the page but made no request — blocked by CSP, an extension, or a 404.`
      )
    );
  }

  if (beacons.length === 0) {
    findings.push(warn("No hit recorded yet", noHitDetail("Google", blocker)));
  } else {
    const silent = ids.filter((id) => !measured.includes(id));
    if (silent.length > 0) {
      findings.push(
        warn("Configured but silent", `${silent.join(", ")} has not sent a hit.`)
      );
    }
  }

  if (findings.length === 0) {
    findings.push(
      ok("Sending data", `${ids.join(", ")} — ${plural(beacons.length, "hit")} observed.`)
    );
  }

  return report("GA4", ids, beacons.length, findings);
}

function detectClarity(
  snapshot: Snapshot,
  blocker: string | null,
  required: boolean
): ToolReport | null {
  const loaded = captureAll(snapshot.resources, CLARITY_TAG);
  const declared = captureAll(scriptSrcs(snapshot), CLARITY_TAG);
  const beacons = matching(snapshot.resources, CLARITY_COLLECT);
  const ids = unique([...loaded, ...declared]);
  const findings: Finding[] = [];

  if (ids.length === 0 && !hasGlobal(snapshot, "clarity")) {
    if (!required) return null;
    findings.push(
      bad("No Clarity tag found", "No clarity.ms/tag request and no window.clarity.")
    );
    return report("Clarity", ids, 0, findings, "upload");
  }

  const blocked = declared.filter((id) => !loaded.includes(id));
  if (blocked.length > 0) {
    findings.push(
      bad(
        "Tag script never loaded",
        `${blocked.join(", ")} is in the page but made no request — blocked by CSP, an extension, or a 404.`
      )
    );
  }

  if (ids.length > 1) {
    findings.push(
      warn("Multiple Clarity projects", `${ids.join(", ")} are both recording.`)
    );
  }

  if (!hasGlobal(snapshot, "clarity")) {
    findings.push(
      warn("Script loaded but window.clarity is missing", "The tag ran but never booted.")
    );
  }

  if (beacons.length === 0) {
    findings.push(warn("No session data sent yet", noHitDetail("clarity.ms", blocker)));
  }

  if (findings.length === 0) {
    findings.push(
      ok("Recording", `${ids.join(", ")} — ${plural(beacons.length, "upload")} observed.`)
    );
  }

  return report("Clarity", ids, beacons.length, findings, "upload");
}

function noHitDetail(destination: string, blocker: string | null): string {
  if (blocker) return `${blocker}, which would explain the silence.`;
  return `The tag is present but has sent nothing to ${destination}. Consent, a blocker, or a misconfigured ID.`;
}

function detectedCmp(snapshot: Snapshot): string | null {
  const srcs = scriptSrcs(snapshot);
  const found = CMP_SPECS.find(
    (cmp) =>
      hasGlobal(snapshot, cmp.global) ||
      snapshot.resources.some((url) => cmp.tag.test(url)) ||
      srcs.some((url) => cmp.tag.test(url))
  );
  if (found) return `${found.name} is managing consent on this page`;
  if (hasGlobal(snapshot, "__tcfapi")) return "A TCF consent framework is running here";
  return null;
}

function blockerOf(snapshot: Snapshot): string | null {
  const state = consentState(snapshot.dataLayer);
  if (state.analytics_storage === "denied") {
    return "Consent Mode still has analytics_storage denied";
  }
  return detectedCmp(snapshot);
}

function specIds(spec: ToolSpec, snapshot: Snapshot, urls: string[]): string[] {
  const fromUrl = spec.idFromUrl ? captureAll(urls, spec.idFromUrl) : [];
  const fromData = idsFromScripts(snapshot.scripts, spec);
  const fromLayer = spec.idFromDataLayer ? spec.idFromDataLayer(snapshot.dataLayer) : [];
  return [...fromUrl, ...fromData, ...fromLayer];
}

function beaconEvents(spec: ToolSpec, beacons: string[]): string[] {
  const param = spec.eventParam;
  if (!param) return [];
  return beacons
    .map((url) => queryParam(url, param))
    .filter((name): name is string => name !== null);
}

function eventSummary(events: string[]): string {
  return [...tally(events)]
    .map(([name, count]) => (count === 1 ? name : `${name} x${count}`))
    .join(", ");
}

function detectSpec(
  spec: ToolSpec,
  snapshot: Snapshot,
  blocker: string | null,
  required: boolean
): ToolReport | null {
  const loaded = matching(snapshot.resources, spec.tag);
  const declared = matching(scriptSrcs(snapshot), spec.tag);
  const booted = spec.global ? hasGlobal(snapshot, spec.global) : false;
  if (loaded.length === 0 && declared.length === 0 && !booted) {
    if (!required) return null;
    return report(
      spec.name,
      [],
      0,
      [bad(`No ${spec.name} tag found`, "No request and no global on this page.")],
      spec.unit
    );
  }

  const allIds = specIds(spec, snapshot, [...loaded, ...declared]);
  const ids = unique(allIds);
  const beacons = spec.beacon ? matching(snapshot.resources, spec.beacon) : [];
  const events = beaconEvents(spec, beacons);
  const isDebug = spec.debugTag
    ? matching([...loaded, ...declared], spec.debugTag).length > 0
    : false;
  const findings: Finding[] = [];

  if (loaded.length === 0 && declared.length > 0) {
    findings.push(
      bad(
        "Tag script never loaded",
        "The script is in the page but made no request — blocked by CSP, an extension, or a 404."
      )
    );
  }

  for (const [id, count] of tally(allIds)) {
    if (count > 1) {
      findings.push(
        bad("Initialised twice", `${id} was set up ${count}x — events will be doubled.`)
      );
    }
  }

  if (spec.global && !booted && loaded.length > 0) {
    findings.push(
      warn(
        `Script loaded but window.${spec.global} is missing`,
        "The tag ran but never booted."
      )
    );
  }

  if (isDebug) {
    findings.push(
      warn(
        "Debug build in use",
        "This script logs to the console instead of reporting, so no events are expected."
      )
    );
  }

  if (spec.beacon && beacons.length === 0 && !isDebug) {
    findings.push(warn("Nothing sent yet", noHitDetail(spec.name, blocker)));
  }

  if (spec.baseEvent && beacons.length > 0 && !events.includes(spec.baseEvent)) {
    findings.push(
      warn(
        `No ${spec.baseEvent} recorded`,
        `Fired ${events.join(", ")} but never ${spec.baseEvent}, so page views are missing.`
      )
    );
  }

  if (findings.length === 0) {
    const label = ids.length > 0 ? ids.join(", ") : "installed";
    const sent =
      events.length > 0 ? eventSummary(events) : plural(beacons.length, spec.unit);
    findings.push(ok("Sending data", `${label} — ${sent} observed.`));
  }

  return report(spec.name, ids, beacons.length, findings, spec.unit);
}

function detectConsent(snapshot: Snapshot): Finding[] {
  const state = consentState(snapshot.dataLayer);
  const keys = Object.keys(state);
  if (keys.length === 0) return [];

  const findings: Finding[] = [];
  if (state.analytics_storage === "denied") {
    findings.push(
      warn(
        "analytics_storage is denied",
        "GA4 runs in cookieless mode — sessions will not be stitched and data looks sparse."
      )
    );
  }
  if (findings.length === 0) {
    findings.push(
      ok("Consent granted", keys.map((key) => `${key}=${state[key]}`).join(", "))
    );
  }
  return findings;
}

export function analyze(snapshot: Snapshot, selected?: ToolKey[]): Report {
  const picked = new Set<ToolKey>(selected?.length ? selected : DEFAULT_TOOLS);
  const blocker = blockerOf(snapshot);
  const core = [
    detectGtm(snapshot, picked.has("gtm")),
    detectGa4(snapshot, blocker, picked.has("ga4")),
    detectClarity(snapshot, blocker, picked.has("clarity")),
  ];
  const extra = TOOL_SPECS.map((spec) =>
    detectSpec(spec, snapshot, blocker, picked.has(spec.key))
  );
  const tools = [...core, ...extra].filter(
    (found): found is ToolReport => found !== null
  );
  const consent = detectConsent(snapshot);
  const level = worst([...tools.flatMap((tool) => tool.findings), ...consent]);
  return { href: snapshot.href, tools, consent, level };
}
