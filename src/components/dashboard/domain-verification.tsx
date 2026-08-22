"use client";

import { useState } from "react";
import { Check, Copy, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Challenge = { hostname: string; recordType: string; name: string; value: string };

export function DomainVerification({ organizationId, verified }: { organizationId: string; verified: boolean }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isVerified, setVerified] = useState(verified);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createChallenge() {
    setPending(true); setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/verification`, { method: "POST" });
    const data = await response.json();
    setPending(false);
    if (!response.ok) return setError(data.error?.message || "Could not create a challenge.");
    if (data.verified) setVerified(true);
    else setChallenge(data);
  }

  async function verify() {
    setPending(true); setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/verification`, { method: "PATCH" });
    const data = await response.json();
    setPending(false);
    if (!response.ok) return setError(data.error?.message || "Verification is not ready.");
    setVerified(true);
  }

  if (isVerified) return <div className="verification-success"><Check size={20} /><div><strong>Domain verified</strong><span>Company control has been proven by DNS.</span></div></div>;
  return (
    <div className="verification-box">
      <div><span className="eyebrow">Required publication gate</span><h3>Verify company domain</h3><p>Add one TXT record to prove that this offer comes from the company—not an impersonator.</p></div>
      {!challenge ? <Button type="button" variant="secondary" onClick={createChallenge} disabled={pending}>{pending && <LoaderCircle className="spin" size={16} />} Generate DNS record</Button> : <>
        <div className="dns-record"><div><span>Type</span><code>{challenge.recordType}</code></div><div><span>Host</span><code>{challenge.name}</code></div><div><span>Value</span><code>{challenge.value}</code><button type="button" onClick={() => navigator.clipboard.writeText(challenge.value)}><Copy size={15} /> Copy</button></div></div>
        <Button type="button" variant="dark" onClick={verify} disabled={pending}>{pending ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} Check DNS now</Button>
      </>}
      {error && <div className="form-error" role="alert">{error}</div>}
    </div>
  );
}
