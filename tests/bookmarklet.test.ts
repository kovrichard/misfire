import { describe, expect, it } from "bun:test";
import { bookmarkletHref, loaderSnippet } from "../src/lib/checker/bookmarklet";

describe("loaderSnippet", () => {
  it("omits the tools param for the default trio", () => {
    expect(
      loaderSnippet("https://misfire.test", ["gtm", "ga4", "clarity"])
    ).not.toContain("tools=");
  });

  it("omits it when nothing is passed", () => {
    expect(loaderSnippet("https://misfire.test")).not.toContain("tools=");
  });

  it("carries the picks when they differ from the default", () => {
    expect(loaderSnippet("https://misfire.test", ["plausible", "posthog"])).toContain(
      "+'&tools=plausible,posthog'"
    );
  });

  it("treats a reordered default as default", () => {
    expect(
      loaderSnippet("https://misfire.test", ["clarity", "gtm", "ga4"])
    ).not.toContain("tools=");
  });

  it("keeps a subset of the default explicit", () => {
    expect(loaderSnippet("https://misfire.test", ["gtm", "ga4"])).toContain(
      "+'&tools=gtm,ga4'"
    );
  });

  it("strips a trailing slash from the host", () => {
    expect(loaderSnippet("https://misfire.test/")).toContain(
      "'https://misfire.test/check.js?t='"
    );
  });
});

describe("bookmarkletHref", () => {
  it("wraps the loader in a javascript: url", () => {
    const href = bookmarkletHref("https://misfire.test", ["hotjar"]);
    expect(href).toStartWith("javascript:(function(){");
    expect(href).toContain("&tools=hotjar");
  });
});
