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
import type { Finding, Level, Report, Snapshot, ToolName, ToolReport } from "./types";

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
  tool: ToolName,
  ids: string[],
  hits: number,
  findings: Finding[]
): ToolReport {
  return { tool, ids, hits, findings, level: worst(findings) };
}

function detectGtm(snapshot: Snapshot): ToolReport {
  const loaded = captureAll(snapshot.resources, GTM_SCRIPT);
  const framed = captureAll(snapshot.resources, GTM_FRAME);
  const declared = captureAll(snapshot.scriptSrcs, GTM_SCRIPT);
  const ids = unique([...loaded, ...framed, ...snapshot.gtmContainers, ...declared]);
  const findings: Finding[] = [];

  if (ids.length === 0) {
    findings.push(
      bad("No GTM container found", "No gtm.js request and no window.google_tag_manager.")
    );
    return report("GTM", ids, 0, findings);
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

  return report("GTM", ids, 0, findings);
}

function detectGa4(snapshot: Snapshot): ToolReport {
  const loads = captureAll(snapshot.resources, GTAG_SCRIPT);
  const declared = captureAll(snapshot.scriptSrcs, GTAG_SCRIPT);
  const configs = configuredMeasurementIds(snapshot.dataLayer);
  const beacons = matching(snapshot.resources, GA_COLLECT);
  const measured = beacons
    .map((url) => queryParam(url, "tid"))
    .filter((id): id is string => id !== null);
  const ids = unique([...loads, ...configs, ...declared, ...measured]);
  const findings: Finding[] = [];

  if (ids.length === 0) {
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
    findings.push(
      warn(
        "No hit recorded yet",
        "The tag is present but has not sent anything to Google. Consent, a blocker, or a misconfigured ID."
      )
    );
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
      ok("Sending data", `${ids.join(", ")} — ${beacons.length} hit(s) observed.`)
    );
  }

  return report("GA4", ids, beacons.length, findings);
}

function detectClarity(snapshot: Snapshot): ToolReport {
  const loaded = captureAll(snapshot.resources, CLARITY_TAG);
  const declared = captureAll(snapshot.scriptSrcs, CLARITY_TAG);
  const beacons = matching(snapshot.resources, CLARITY_COLLECT);
  const ids = unique([...loaded, ...declared]);
  const findings: Finding[] = [];

  if (ids.length === 0 && !snapshot.hasClarity) {
    findings.push(
      bad("No Clarity tag found", "No clarity.ms/tag request and no window.clarity.")
    );
    return report("Clarity", ids, 0, findings);
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

  if (!snapshot.hasClarity) {
    findings.push(
      warn("Script loaded but window.clarity is missing", "The tag ran but never booted.")
    );
  }

  if (beacons.length === 0) {
    findings.push(
      warn(
        "No session data sent yet",
        "Clarity is present but has not posted to clarity.ms/collect."
      )
    );
  }

  if (findings.length === 0) {
    findings.push(
      ok("Recording", `${ids.join(", ")} — ${beacons.length} upload(s) observed.`)
    );
  }

  return report("Clarity", ids, beacons.length, findings);
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

export function analyze(snapshot: Snapshot): Report {
  const tools = [detectGtm(snapshot), detectGa4(snapshot), detectClarity(snapshot)];
  const consent = detectConsent(snapshot);
  const level = worst([...tools.flatMap((tool) => tool.findings), ...consent]);
  return { href: snapshot.href, tools, consent, level };
}
