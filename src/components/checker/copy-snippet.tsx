"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopySnippet({
  code,
  preview,
  bordered = true,
}: Readonly<{ code: string; preview?: ReactNode; bordered?: boolean }>) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className={cn(
        "flex items-start gap-[12px] rounded-md bg-neutral-100 px-[16px] py-[13px]",
        bordered && "border border-border"
      )}
    >
      <code className="min-w-0 flex-1 break-all pt-[3px] font-mono text-[12.5px] text-neutral-800 leading-[1.65]">
        {preview ?? code}
      </code>
      <Button
        variant="outline"
        onClick={copy}
        className="h-auto min-w-[76px] shrink-0 rounded-full bg-canvas px-[14px] py-[4px] font-heading font-normal text-[12px] leading-[1.2] shadow-none"
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
