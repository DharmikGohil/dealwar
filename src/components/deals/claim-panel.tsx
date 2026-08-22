"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export function ClaimPanel({
  slug,
  signedIn,
  available,
}: {
  slug: string;
  signedIn: boolean;
  available: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<{ code: string; redemptionUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function executeClaim() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${encodeURIComponent(slug)}/claim`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message || "The claim could not be completed.");
        return;
      }
      setClaim({ code: data.code, redemptionUrl: data.redemptionUrl });
    } catch {
      setError("The claim service is temporarily unreachable.");
    } finally {
      setPending(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="claim-panel">
        <LockKeyhole size={28} />
        <h2>One quick identity check.</h2>
        <p>Sign in with a verified email. It keeps one person from draining the pool.</p>
        <ButtonLink href={`/sign-in?next=/deals/${slug}`} variant="dark">Sign in to claim</ButtonLink>
      </div>
    );
  }

  if (claim) {
    return (
      <div className="claim-panel claim-success">
        <div className="success-mark"><Check size={30} /></div>
        <span className="eyebrow">Credit secured</span>
        <h2>Your private code</h2>
        <div className="coupon-reveal">
          <code>{claim.code}</code>
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(claim.code); setCopied(true); }}>
            {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <a className="button button-dark" href={claim.redemptionUrl} target="_blank" rel="noopener noreferrer sponsored">
          Redeem with company <ArrowUpRight size={17} />
        </a>
        <p className="microcopy">Store this code now. It also remains attached to your DealWar account.</p>
      </div>
    );
  }

  return (
    <div className="claim-panel">
      <span className="eyebrow">One code per person</span>
      <h2>{available ? "Take the deal." : "The pool is empty."}</h2>
      <p>DealWar allocates a unique code in a locked transaction. Companies never receive your password or raw network data.</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      <Button type="button" variant="dark" onClick={executeClaim} disabled={pending || !available}>
        {pending && <LoaderCircle size={17} className="spin" />}
        {pending ? "Locking your code" : "Claim this credit"}
      </Button>
    </div>
  );
}
