"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopySnippet({
  code,
  preview,
}: Readonly<{ code: string; preview?: string }>) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border bg-muted/40 p-4 pr-14 text-xs leading-relaxed">
        <code>{preview ?? code}</code>
      </pre>
      <Button
        variant="outline"
        size="xs"
        onClick={copy}
        className="absolute top-3 right-3"
      >
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
