import Image from "next/image";
import Link from "next/link";
import type React from "react";
import CatalystBadge from "@/components/footer/catalyst-badge";
import { JsonLd, organizationLd, webSiteLd } from "@/components/marketing/json-ld";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <JsonLd data={organizationLd()} />
      <JsonLd data={webSiteLd()} />
      <header className="container flex w-full items-center justify-end gap-4 py-4">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 whitespace-pre font-medium text-lg"
        >
          <Image src="/icon.svg" alt="analytics-check" width={30} height={30} />
          analytics-check
        </Link>
      </header>
      {children}
      <footer className="container flex w-full justify-start py-4">
        <CatalystBadge />
      </footer>
    </div>
  );
}
