"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    try {
      const result = mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name, callbackURL: "/dashboard" })
        : await authClient.signIn.email({ email, password, callbackURL: "/dashboard" });
      if (result.error) {
        setError(result.error.message || "Authentication failed.");
        return;
      }
      if (mode === "sign-up" && !result.data?.token) {
        setVerificationEmail(email);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("We could not reach the authentication service.");
    } finally {
      setPending(false);
    }
  }

  if (verificationEmail) {
    return (
      <div className="auth-success" role="status">
        <MailCheck size={28} aria-hidden="true" />
        <strong>Check your inbox.</strong>
        <p>We sent a secure verification link to {verificationEmail}. Open it to activate your account and enter the control room.</p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "sign-up" && (
        <label>
          <span>Your name</span>
          <input name="name" autoComplete="name" required minLength={2} maxLength={80} />
        </label>
      )}
      <label>
        <span>Work email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span className="password-label">Password {mode === "sign-in" && <Link href="/forgot-password">Forgot password?</Link>}</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          required
          minLength={12}
          maxLength={128}
        />
        {mode === "sign-up" && <small>12+ characters. Use a password manager.</small>}
      </label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <Button type="submit" variant="dark" disabled={pending}>
        {pending ? <LoaderCircle className="spin" size={17} /> : null}
        {mode === "sign-up" ? "Create account" : "Enter control room"}
        {!pending && <ArrowRight size={17} />}
      </Button>
    </form>
  );
}
