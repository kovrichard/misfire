import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkletLink } from "@/components/checker/bookmarklet-link";
import { CopySnippet } from "@/components/checker/copy-snippet";
import { mono } from "@/components/marketing/fonts";
import { bookmarkletHref, loaderSnippet } from "@/lib/checker/bookmarklet";
import conf from "@/lib/config";
import { metaDescription, metaTitle, openGraph } from "@/lib/metadata";
import { cn } from "@/lib/utils";

const path = "/";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: { canonical: path },
  openGraph: { ...openGraph, url: path },
};

const CHECKS = [
  {
    tool: "Google Tag Manager",
    items: [
      "Container ID, read from the gtm.js request",
      "Container loaded but never initialised",
      "More than one container on the page",
    ],
  },
  {
    tool: "Google Analytics 4",
    items: [
      "Measurement ID, from the tag and from the collect beacon",
      "The same property measured twice — every session double counted",
      "Tag present but no hit ever sent",
    ],
  },
  {
    tool: "Microsoft Clarity",
    items: [
      "Project ID, read from the tag request",
      "Script loaded but window.clarity never booted",
      "Recording but uploading nothing",
    ],
  },
];

const bundle = readFileSync(join(process.cwd(), "public/check.js"), "utf-8");

function bundlePreview(code: string): string {
  const kb = (code.length / 1024).toFixed(1);
  return `${code.slice(0, 52)}…  // the whole checker, ${kb} KB, no network`;
}

export default function Home() {
  const href = bookmarkletHref(conf.host);
  const snippet = loaderSnippet(conf.host);

  return (
    <main className="container flex flex-1 flex-col gap-16 py-12">
      <section className="flex max-w-2xl flex-col gap-4">
        <h1 className="font-semibold text-4xl tracking-tight">
          Know whether your tags actually fire.
        </h1>
        <p className="text-lg text-muted-foreground">
          Reading a page&apos;s HTML tells you nothing — anything deployed through GTM is
          injected at runtime and never appears in the source. This runs inside the page
          instead, so it sees the real network log: which containers loaded, which IDs are
          configured, and whether a single hit was ever sent.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-2xl tracking-tight">Install</h2>
        <p className="text-muted-foreground">
          Drag this to your bookmarks bar, then click it on any page you want to check.
        </p>
        <div>
          <BookmarkletLink href={href} fallbackHref="/demo" label="✓ Check analytics" />
        </div>
        <p className="text-muted-foreground text-sm">Prefer the console? Same loader:</p>
        <CopySnippet code={snippet} />

        <h3 className="pt-4 font-medium text-lg">When the site has a strict CSP</h3>
        <p className="text-muted-foreground text-sm">
          Both of the above fetch{" "}
          <code className={cn(mono.className, "text-foreground")}>check.js</code>, and a
          strict <code className={cn(mono.className, "text-foreground")}>script-src</code>{" "}
          blocks that fetch. Running the loader from the DevTools console does not get
          around it: the console evaluates what you type, but the{" "}
          <code className={cn(mono.className, "text-foreground")}>
            &lt;script src&gt;
          </code>{" "}
          it appends is still the page loading a script, so the policy still applies.
          Paste the whole checker instead — it requests nothing.
        </p>
        <CopySnippet code={bundle} preview={bundlePreview(bundle)} />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-semibold text-2xl tracking-tight">What it checks</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {CHECKS.map((check) => (
            <div key={check.tool} className="flex flex-col gap-3 rounded-lg border p-5">
              <h3 className={cn(mono.className, "font-medium text-sm")}>{check.tool}</h3>
              <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
                {check.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="font-semibold text-2xl tracking-tight">See it catch something</h2>
        <p className="text-muted-foreground">
          The{" "}
          <Link href="/demo" className="text-primary underline underline-offset-4">
            demo page
          </Link>{" "}
          installs GA4 twice over and denies analytics consent. Run the bookmarklet there
          and it should report both. If it does not, the checker is broken — not your
          site.
        </p>
      </section>
    </main>
  );
}
