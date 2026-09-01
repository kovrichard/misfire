const LOADER =
  "var d=document,s=d.createElement('script');s.src='HOST/check.js?t='+Date.now();d.body.appendChild(s);";

export function loaderSnippet(host: string): string {
  return LOADER.replace("HOST", host.replace(/\/+$/, ""));
}

export function bookmarkletHref(host: string): string {
  return `javascript:(function(){${loaderSnippet(host)}})();`;
}
