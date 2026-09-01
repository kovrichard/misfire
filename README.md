# <img src="src/app/icon.svg" alt="" width="28" height="28" /> Misfire

**Know whether your tags actually fire.**

Reading a page's HTML tells you nothing. Anything deployed through a tag manager is
injected at runtime and never appears in the source, so "view source and search for
gtag" reports *not installed* on exactly the setups that matter. Misfire runs **inside
the page** instead, and reads the network log the browser already kept: which containers
loaded, which IDs are configured, and whether a single hit was ever sent.

Live at **[misfire.konvert7.com](https://misfire.konvert7.com)**.

## How you run it

Three ways in, all client side. Nothing is uploaded, and there is no account.

| | How | When |
| --- | --- | --- |
| **Bookmarklet** | Drag the button to your bookmarks bar, click it on any page | Everyday use |
| **Console** | Copy the loader, paste into DevTools | You would rather not keep a bookmark |
| **Inline paste** | Copy the whole checker, paste into DevTools | The site has a strict `script-src` |

The third exists because the first two fetch `check.js`, and a strict CSP blocks that
fetch. Running the loader from the console does not get around it: the console evaluates
what you type, but the `<script src>` it appends is still the page loading a script. The
inline paste requests nothing, so nothing can block it.

## What it checks

Seventeen tools. Pick the ones you care about and the bookmarklet is built from that
selection; **GTM, GA4 and Clarity** are on by default.

| Tool | Category | Key |
| --- | --- | --- |
| Cloudflare Web Analytics | Measurement | `cloudflare` |
| DataFast | Measurement | `datafast` |
| Fathom | Measurement | `fathom` |
| Google Ads | Advertising | `googleads` |
| Google Analytics 4 | Measurement | `ga4` |
| Google Tag Manager | Containers | `gtm` |
| Hotjar | Recording | `hotjar` |
| LinkedIn Insight | Advertising | `linkedin` |
| Matomo | Measurement | `matomo` |
| Meta Pixel | Advertising | `meta` |
| Microsoft Clarity | Recording | `clarity` |
| Mixpanel | Product analytics | `mixpanel` |
| Plausible | Measurement | `plausible` |
| PostHog | Product analytics | `posthog` |
| Quora Pixel | Advertising | `quora` |
| Umami | Measurement | `umami` |
| Vercel Analytics | Measurement | `vercel` |

Selection is three-way rather than on/off, so picking a few tools does not blind you to
the rest:

```
picked + absent      -> reported as an error
unpicked + present   -> still listed, because it is really there
unpicked + absent    -> silent
```

A site running only Plausible sees Plausible, plus whatever else the page actually
loaded, and nothing about tags it has never installed.

Consent platforms (OneTrust, Cookiebot, Osano, CookieYes, a bare `__tcfapi`) are always
detected, and only to explain silence. "No hit recorded yet" then names denied Consent
Mode or the platform holding the tag, instead of listing three things it might be.

## What counts as a hit

The distinction the whole tool rests on is **loaded** versus **fired**. A tag that loads
and sends nothing looks healthy in every source view and reports no data.

That makes vendor requests which are *not* evidence of delivery the main trap, and each
one is pinned by a test that widens the pattern and watches it fail:

- LinkedIn's `insight_tag_errors.gif` is the pixel complaining, not succeeding
- Mixpanel's `settings/` and `flags/` are the library fetching its own configuration
- Fathom's beacon shares a host with its script, so matching the host counts the script
- Google Ads and GA4 share the same `gtag/js` loader and are told apart by ID prefix
- Universal Analytics traffic is not GA4 traffic, even on the same collect endpoint

## Architecture

`src/lib/checker/` is the whole checker. It splits at the `Snapshot` boundary:

| | |
| --- | --- |
| `patterns.ts`, `datalayer.ts`, `registry.ts`, `catalog.ts`, `detect.ts` | **Pure.** A `Snapshot` in, a `Report` out. No `window`. |
| `snapshot.ts`, `panel.ts`, `entry.ts` | **Browser only.** Reads the page, draws the panel. |

Everything about *what is true* is testable without a DOM, which is why the detection
rules have real tests rather than screenshots.

`entry.ts` is bundled to `public/check.js` as an IIFE by a `prebuild` hook, so there is
one source of truth and no committed artifact.

### Adding a tool

Most tools are a `TOOL_SPEC` entry plus a card:

```ts
{
  key: "yourtool",
  name: "Your Tool",
  tag: /cdn\.yourtool\.com\/script\.js/i,   // the script
  beacon: /api\.yourtool\.com\/collect/i,   // proof it sent something
  global: "yourtool",                       // proof it booted
  idFromData: "siteId",                     // data-site-id on the tag
  unit: "event",
}
```

IDs can come from four places, because vendors put them in four places: a `data-`
attribute (`idFromData`), the script URL (`idFromUrl`), a global queue such as `fbq`
(`idFromDataLayer`), the beacon's query (`idFromBeacon`), or any request path
(`idFromResource`). `idTransform` handles Cloudflare, which wraps its token in JSON.

**Read the vendor's shipped script before writing the pattern.** Every signature here
came from `curl`-ing the real file, and it repeatedly contradicted what was reasonable to
assume. Meta's pixel ID is unreadable from `fbq.queue` on a real page because the queue
drains once `fbevents.js` loads; it is in `signals/config/<id>` instead. Matomo looked
like it needed `_paq` capture until the tracking request turned out to carry `idsite`.

Beware collisions. Plausible's proxy pattern matched DataFast's script, and a bare
`/script.js` would claim any site that serves one. `exclude` exists for that, and narrow
patterns beat broad ones: detected without an ID beats invented on the wrong site.

## Development

Requires [Bun](https://bun.sh). No database, no services, nothing to configure.

```bash
bun install
bun run dev          # http://localhost:3000
```

`SCHEME` and `AUTHORITY` build the bookmarklet URL and are read at **build time**, so
changing them needs a rebuild. See `.env.sample`; the defaults suit local work.

```bash
bun run test         # detection rules
bun run check        # biome
bun run type-check   # tsc --noEmit
bun run klint        # architecture rules
bun run knip         # dead code
bun run build        # also rebuilds public/check.js
```

`/demo` installs GA4 twice over, initialises the same Meta pixel twice and denies
analytics consent, so the checker can be seen catching something rather than asserted to
work. It talks to neither Google nor Meta: the duplicates live in `dataLayer` and the
`fbq` queue, which is exactly where the checker reads them from.

## Built with

[Catalyst](https://catalyst.konvert7.com)
