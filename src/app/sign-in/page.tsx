import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <section className="auth-page">
      <div className="auth-poster"><span>CLAIM.</span><span>COMPETE.</span><strong>WIN.</strong></div>
      <div className="auth-panel">
        <span className="eyebrow">Secure access</span>
        <h1>Back in the ring.</h1>
        <p>Sign in to claim live credits or manage your company’s position.</p>
        <AuthForm mode="sign-in" />
        <p className="auth-switch">New here? <Link href="/sign-up">Create an account</Link></p>
      </div>
    </section>
  );
}
