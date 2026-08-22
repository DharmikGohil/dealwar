import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <section className="auth-page">
      <div className="auth-poster auth-poster-acid"><span>NEW KEY.</span><span>SAME YOU.</span><strong>SECURED.</strong></div>
      <div className="auth-panel"><span className="eyebrow">Secure reset</span><h1>Choose the key.</h1><p>Use a unique password with at least 12 characters, preferably from a password manager.</p><PasswordRecoveryForm token={params.token} invalid={Boolean(params.error) || !params.token} /><p className="auth-switch"><Link href="/forgot-password">Request another link</Link></p></div>
    </section>
  );
}
