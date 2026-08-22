"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // A production error reporter can capture the opaque digest without rendering internals.
    if (error.digest) document.documentElement.dataset.errorDigest = error.digest;
  }, [error]);
  return <section className="error-poster"><span className="eyebrow">The bell stopped</span><strong>HOLD.</strong><h1>Something broke backstage.</h1><p>No payment or claim should be repeated until we check the latest state.</p><button type="button" onClick={reset}><RotateCcw size={17} /> Try this page again</button></section>;
}
