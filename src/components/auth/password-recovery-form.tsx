"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function PasswordRecoveryForm({ token, invalid }: { token?: string; invalid?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(invalid ? "This reset link is invalid or expired." : null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      if (token) {
        const password = String(data.get("password") || "");
        const confirmation = String(data.get("confirmation") || "");
        if (password !== confirmation) throw new Error("The passwords do not match.");
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error) throw new Error(result.error.message || "Password reset failed.");
        router.push("/sign-in?reset=complete");
        return;
      }
      const email = String(data.get("email") || "").trim();
      const result = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
      if (result.error) throw new Error(result.error.message || "Reset request failed.");
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not complete the request.");
    } finally {
      setPending(false);
    }
  }

  if (sent) return <div className="auth-success"><Check /><strong>Check your inbox.</strong><p>If that address has an account, a reset link is on its way.</p></div>;
  return (
    <form className="auth-form" onSubmit={submit}>
      {token ? (
        <>
          <label><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label><span>Confirm password</span><input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        </>
      ) : (
        <label><span>Account email</span><input name="email" type="email" autoComplete="email" required /></label>
      )}
      {error && <div className="form-error" role="alert">{error}</div>}
      <Button type="submit" variant="dark" disabled={pending || Boolean(invalid)}>
        {pending ? <LoaderCircle className="spin" size={17} /> : null}
        {token ? "Set new password" : "Send secure reset link"}
        {!pending && <ArrowRight size={17} />}
      </Button>
    </form>
  );
}
