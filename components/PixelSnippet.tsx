"use client";

import { useState } from "react";

export function PixelSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard denied */ }
  }

  return (
    <div className="mt-3">
      <pre className="overflow-x-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-white/90">
        <code>{snippet}</code>
      </pre>
      <button onClick={copy} className="btn-secondary btn-sm mt-3">
        {copied ? "Copied ✓" : "📋 Copy snippet"}
      </button>
    </div>
  );
}
