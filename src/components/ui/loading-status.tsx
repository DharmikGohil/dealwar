"use client";

import { useEffect, useState } from "react";

export function LoadingStatus({ label }: { label: string }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 9000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="skeleton-status" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {slow && (
        <div className="skeleton-slow-note">
          <span>Still loading.</span>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
    </div>
  );
}
