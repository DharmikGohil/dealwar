import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <section className="auth-page">
      <div className="auth-poster"><span>LOCKED?</span><span>RESET.</span><strong>RETURN.</strong></div>
      <div className="auth-panel"><span className="eyebrow">Account recovery</span><h1>Get back in.</h1><p>We’ll send a single-use link. For privacy, the response is the same whether an account exists or not.</p><PasswordRecoveryForm /><p className="auth-switch"><Link href="/sign-in">Return to sign in</Link></p></div>
    </section>
  );
}
