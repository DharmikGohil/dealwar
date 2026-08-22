"use client";

import { useState } from "react";
import { CalendarPlus, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type RoundSummary = { id: string; name: string; status: string; startsAt: string; endsAt: string; dealCount: number };

export function RoundManager({ rounds }: { rounds: RoundSummary[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const startsAt = new Date(String(form.get("startsAt")));
      const endsAt = new Date(String(form.get("endsAt")));
      const response = await fetch("/api/admin/rounds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), strapline: form.get("strapline"), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Round could not be created.");
      window.location.reload();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Round could not be created."); setPending(false); }
  }
  return <section className="round-manager"><div className="dashboard-section-title"><h2>Competition rounds</h2><Button onClick={() => setOpen((value) => !value)} variant="secondary"><CalendarPlus size={16} /> {open ? "Close" : "Schedule round"}</Button></div>
    {open && <form className="round-form" onSubmit={submit}><div className="form-grid"><label><span>Round name</span><input name="name" minLength={3} maxLength={80} required /></label><label><span>Public strapline</span><input name="strapline" minLength={8} maxLength={160} required /></label><label><span>Starts</span><input name="startsAt" type="datetime-local" required /></label><label><span>Ends</span><input name="endsAt" type="datetime-local" required /></label></div>{error && <div className="form-error">{error}</div>}<Button type="submit" variant="dark" disabled={pending}>{pending && <LoaderCircle className="spin" size={16} />} Schedule competition</Button></form>}
    <div className="round-strip">{rounds.map((round) => <article key={round.id}><span className={`round-state round-${round.status.toLowerCase()}`}>{round.status}</span><strong>{round.name}</strong><small>{new Date(round.startsAt).toLocaleDateString()} → {new Date(round.endsAt).toLocaleDateString()}</small><b>{round.dealCount} entries</b></article>)}</div>
  </section>;
}
