"use client";

import { useState } from "react";
import { Check, LoaderCircle, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModerationActions({ dealId, status }: { dealId: string; status: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function act(action: "approve" | "reject" | "pause" | "resume") {
    setPending(true); setError(null);
    const response = await fetch(`/api/admin/deals/${dealId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason: reason || undefined }) });
    const data = await response.json();
    setPending(false);
    if (!response.ok) return setError(data.error?.message || "Action failed.");
    window.location.reload();
  }

  return <div className="moderation-actions"><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={3} placeholder="Internal review note or required rejection reason" />{error && <div className="form-error">{error}</div>}<div>{status === "PENDING_REVIEW" && <><Button disabled={pending} onClick={() => act("approve")}><Check size={16} /> Approve</Button><Button disabled={pending} variant="secondary" onClick={() => act("reject")}><X size={16} /> Reject</Button></>}{status === "LIVE" && <Button disabled={pending} variant="secondary" onClick={() => act("pause")}><Pause size={16} /> Pause</Button>}{status === "PAUSED" && <Button disabled={pending} onClick={() => act("resume")}><Check size={16} /> Resume</Button>}{pending && <LoaderCircle className="spin" size={18} />}</div></div>;
}
