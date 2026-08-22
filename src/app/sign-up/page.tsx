import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Create account" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <section className="auth-page">
      <div className="auth-poster auth-poster-acid"><span>REAL DEALS.</span><span>REAL PEOPLE.</span><strong>NO BOTS.</strong></div>
      <div className="auth-panel">
        <span className="eyebrow">Join DealWar</span>
        <h1>Pick a side.</h1>
        <p>One account lets you claim deals and publish verified credit pools.</p>
        <AuthForm mode="sign-up" />
        <p className="auth-switch">Already registered? <Link href="/sign-in">Sign in</Link></p>
      </div>
    </section>
  );
}
