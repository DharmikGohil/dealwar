"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ClaimCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div className="saved-code">
      <code>{code}</code>
      <button type="button" onClick={copy} aria-label="Copy coupon code">
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
