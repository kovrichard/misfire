import { describe, expect, it } from "bun:test";
import { catalystReferralUrl } from "../src/lib/catalyst";

describe("catalystReferralUrl", () => {
  it("carries the three referral params the badge used to send", () => {
    const url = new URL(catalystReferralUrl("analytics-check.konvert7.com"));
    expect(url.searchParams.get("utm_source")).toBe("analytics-check.konvert7.com");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
    expect(url.searchParams.get("utm_campaign")).toBe("made-with-badge");
  });

  it("drops the port, since utm_source is a hostname", () => {
    const url = new URL(catalystReferralUrl("localhost:3000"));
    expect(url.searchParams.get("utm_source")).toBe("localhost");
  });

  it("points at Catalyst", () => {
    expect(catalystReferralUrl("example.com")).toStartWith(
      "https://catalyst.konvert7.com/?"
    );
  });
});
