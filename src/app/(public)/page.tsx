import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkletLink } from "@/components/checker/bookmarklet-link";
import { CopySnippet } from "@/components/checker/copy-snippet";
import { bookmarkletHref, loaderSnippet } from "@/lib/checker/bookmarklet";
import conf from "@/lib/config";
import { metaDescription, metaTitle, openGraph } from "@/lib/metadata";

const path = "/";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: { canonical: path },
  openGraph: { ...openGraph, url: path },
};

const CHECKS = [
  {
    kicker: "Containers",
    name: "Google Tag Manager",
    items: [
      "Container ID from the gtm.js request",
      "Loaded but never initialised",
      "More than one container",
    ],
  },
  {
    kicker: "Measurement",
    name: "Google Analytics 4",
    items: [
      "Measurement ID from the tag and the beacon",
      "One property measured twice, doubling sessions",
      "Tag present but no hit ever sent",
    ],
  },
  {
    kicker: "Recording",
    name: "Microsoft Clarity",
    items: [
      "Project ID from the tag request",
      "Loaded but window.clarity never booted",
      "Recording but uploading nothing",
    ],
  },
];

const bundle = readFileSync(join(process.cwd(), "public/check.js"), "utf-8");

function CheckerPreview({ code }: Readonly<{ code: string }>) {
  const kb = (code.length / 1024).toFixed(1);
  return (
    <>
      {`${code.slice(0, 44)}…  `}
      <span className="text-olive-700">{`// the whole checker, ${kb} KB, no network`}</span>
    </>
  );
}

export default function Home() {
  const href = bookmarkletHref(conf.host);
  const snippet = loaderSnippet(conf.host);

  return (
    <main className="mx-auto w-full max-w-[800px] flex-1 px-[clamp(16px,4vw,44px)] pt-[clamp(28px,6vw,64px)] pb-[56px]">
      <section>
        <span className="inline-flex items-center rounded-full bg-olive-100 px-[10px] py-[3px] text-[11px] text-olive-800 tracking-[0.02em]">
          Bookmarklet · runs inside the page
        </span>
        <h1 className="my-[var(--space-3)] text-balance text-[clamp(34px,6.5vw,48px)]">
          Know whether your tags actually fire.
        </h1>
        <p className="max-w-[40em] text-pretty text-[16.5px] text-neutral-800 leading-[1.6]">
          Reading a page&apos;s HTML tells you nothing. Anything deployed through GTM is
          injected at runtime and never appears in the source. This runs inside the page
          instead, so it sees the real network log: which containers loaded, which IDs are
          configured, and whether a single hit was ever sent.
        </p>
      </section>

      <section className="mt-[clamp(40px,7vw,60px)]">
        <h6 className="mb-[var(--space-3)] text-[13px] text-brand-700 uppercase tracking-[0.08em]">
          Install
        </h6>
        <p className="mb-[var(--space-3)] text-[15px] text-neutral-800">
          Drag this to your bookmarks bar, then click it on any page you want to check.
        </p>
        <BookmarkletLink href={href} fallbackHref="/demo" label="✓  Misfire" />

        <p className="mt-[var(--space-6)] mb-[var(--space-2)] text-[15px] text-neutral-800">
          Prefer the console? Same loader:
        </p>
        <CopySnippet code={snippet} />

        <div className="mt-[var(--space-8)] rounded-[calc(var(--radius-lg)*1.15)] bg-olive-100 p-[clamp(18px,4vw,28px)]">
          <h4 className="mb-[var(--space-2)] text-[20px] text-olive-900">
            When the site has a strict CSP
          </h4>
          <p className="mb-[var(--space-3)] text-pretty text-[14.5px] text-olive-900 leading-[1.6]">
            Both of the above fetch <code className="text-[13px]">check.js</code>, and a
            strict <code className="text-[13px]">script-src</code> blocks that fetch.
            Running the loader from the console does not get around it. The{" "}
            <code className="text-[13px]">&lt;script src&gt;</code> it appends is still
            the page loading a script. Paste the whole checker instead; it requests
            nothing.
          </p>
          <CopySnippet
            code={bundle}
            bordered={false}
            preview={<CheckerPreview code={bundle} />}
          />
        </div>
      </section>

      <section className="mt-[clamp(40px,7vw,60px)]">
        <h6 className="mb-[var(--space-4)] text-[13px] text-brand-700 uppercase tracking-[0.08em]">
          What it checks
        </h6>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[var(--space-3)]">
          {CHECKS.map((check) => (
            <div
              key={check.name}
              className="flex flex-col gap-[var(--space-2)] rounded-[calc(var(--radius-lg)*1.15)] bg-surface p-[var(--space-4)]"
            >
              <span className="text-[10px] text-brand uppercase tracking-[0.1em]">
                {check.kicker}
              </span>
              <span className="font-heading text-[17px] leading-[1.2]">{check.name}</span>
              <ul className="mt-[var(--space-1)] flex list-none flex-col gap-[var(--space-2)] border-divider border-t p-0 pt-[var(--space-3)] text-[13.5px] text-neutral-800 leading-[1.45]">
                {check.items.map((item) => (
                  <li key={item} className="flex gap-[8px]">
                    <span className="shrink-0 font-bold text-brand">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-[var(--space-4)] text-pretty text-[14.5px] text-neutral-700 leading-[1.65]">
          Also detected, but only listed when actually on the page: Plausible, PostHog,
          Vercel Analytics, Meta Pixel, Hotjar. And the consent platform (OneTrust,
          Cookiebot, Osano, CookieYes or a bare TCF framework), so a tag that loaded but
          sent nothing names what is holding it instead of shrugging at you.
        </p>
      </section>

      <section className="mt-[clamp(40px,7vw,60px)] flex flex-wrap items-center gap-[var(--space-4)] rounded-[calc(var(--radius-lg)*1.15)] bg-surface p-[clamp(18px,4vw,28px)]">
        <div className="min-w-[220px] flex-1">
          <h4 className="mb-[var(--space-2)] text-[20px]">See it catch something</h4>
          <p className="text-pretty text-[14.5px] text-neutral-800 leading-[1.6]">
            The demo page installs GA4 twice over and denies analytics consent. Run the
            bookmarklet there and it should report both. If it does not, the checker is
            broken, not your site.
          </p>
        </div>
        <Link
          href="/demo"
          className="inline-flex shrink-0 items-center justify-center gap-[6px] rounded-full bg-brand px-[15.84px] py-[var(--space-2)] font-heading text-[14px] text-canvas leading-[1.2] no-underline hover:bg-brand-600 active:bg-brand-700"
        >
          Open the demo
        </Link>
      </section>
    </main>
  );
}
