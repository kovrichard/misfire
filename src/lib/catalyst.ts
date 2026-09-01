const CATALYST_URL = "https://catalyst.konvert7.com/";
const MEDIUM = "utm_medium=referral";
const CAMPAIGN = "utm_campaign=made-with-badge";

export function catalystReferralUrl(authority: string): string {
  const host = authority.split(":")[0];
  const params = [`utm_source=${host}`, MEDIUM, CAMPAIGN].join("&");
  return `${CATALYST_URL}?${params}`;
}
