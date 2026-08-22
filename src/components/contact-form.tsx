"use client";

import { useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Message could not be sent.");
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Message could not be sent.");
    } finally { setPending(false); }
  }
  if (sent) return <div className="contact-success"><Check /><h2>Message received.</h2><p>Support will reply to the address you supplied.</p></div>;
  return <form className="contact-form" onSubmit={submit}>
    <div className="form-grid"><label><span>Name</span><input name="name" minLength={2} maxLength={80} required /></label><label><span>Email</span><input name="email" type="email" required /></label></div>
    <label><span>Topic</span><select name="topic" defaultValue="general"><option value="general">General question</option><option value="claim">Claim problem</option><option value="company">Company entry</option><option value="privacy">Privacy request</option><option value="appeal">Moderation appeal</option><option value="security">Security report</option></select></label>
    <label><span>Message</span><textarea name="message" rows={7} minLength={20} maxLength={4000} required /></label>
    <label className="contact-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
    {error && <div className="form-error" role="alert">{error}</div>}
    <Button type="submit" variant="dark" disabled={pending}>{pending && <LoaderCircle className="spin" size={17} />}{pending ? "Sending" : "Send to support"}{!pending && <ArrowRight size={17} />}</Button>
  </form>;
}
