import type { Metadata } from "next";
import Script from "next/script";
import { mono } from "@/components/marketing/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Deliberately broken install — analytics-check",
  description:
    "A page with a knowingly wrong GA4 setup, used to prove the checker works.",
  alternates: { canonical: "/demo" },
  robots: "noindex, nofollow",
};

const BROKEN_INSTALL = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-DEM0BR0KEN');
gtag('config', 'G-DEM0BR0KEN');
gtag('consent', 'default', { analytics_storage: 'denied' });

!function(f){if(f.fbq)return;var n=f.fbq=function(){n.queue.push(arguments)};
f._fbq=n;n.queue=[];}(window);
fbq('init', '8891234567890');
fbq('init', '8891234567890');`;

const EXPECTED = [
  "GA4 — Measured twice: G-DEM0BR0KEN configured 2x",
  "GA4 — No hit recorded yet, blamed on denied Consent Mode",
  "Meta Pixel — Initialised twice: 8891234567890 set up 2x",
  "Meta Pixel — Nothing sent yet",
  "Consent — analytics_storage is denied",
  "GTM — No GTM container found",
  "Clarity — No Clarity tag found",
];

export default function Demo() {
  return (
    <main className="container flex flex-1 flex-col gap-8 py-12">
      {/* biome-ignore lint/correctness/useUniqueElementIds: next/script keys inline scripts by id to dedupe them across renders */}
      <Script id="broken-analytics" strategy="afterInteractive">
        {BROKEN_INSTALL}
      </Script>

      <section className="flex max-w-2xl flex-col gap-4">
        <h1 className="font-semibold text-3xl tracking-tight">
          A deliberately broken install
        </h1>
        <p className="text-muted-foreground">
          This page configures the same GA4 property twice, initialises the same Meta
          pixel twice, and denies analytics consent. Nothing here talks to Google or Meta
          — the duplicates live in{" "}
          <code className={cn(mono.className, "text-foreground")}>dataLayer</code> and the{" "}
          <code className={cn(mono.className, "text-foreground")}>fbq</code> queue, which
          is exactly where the checker reads them from. Run the bookmarklet now.
        </p>
      </section>

      <section className="flex max-w-2xl flex-col gap-4">
        <h2 className="font-semibold text-xl tracking-tight">The install</h2>
        <pre className="overflow-x-auto rounded-md border bg-muted/40 p-4 text-xs leading-relaxed">
          <code>{BROKEN_INSTALL}</code>
        </pre>
      </section>

      <section className="flex max-w-2xl flex-col gap-4">
        <h2 className="font-semibold text-xl tracking-tight">What you should see</h2>
        <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
          {EXPECTED.map((line) => (
            <li key={line} className={mono.className}>
              {line}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
