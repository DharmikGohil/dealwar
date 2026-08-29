import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { safeReturnPath } from "@/lib/safe-return-path";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string; intent?: string }> }) {
  const query = await searchParams;
  const nextPath = safeReturnPath(query.next);
  if (await getCurrentUser()) redirect(nextPath);
  const intent = query.intent === "claim" ? "claim" : query.intent === "brand" ? "brand" : "account";
  const signInParams = new URLSearchParams({ next: nextPath });
  if (intent !== "account") signInParams.set("intent", intent);
  return (
    <section className="auth-page">
      <div className="auth-poster auth-poster-acid"><span>REAL DEALS.</span><span>REAL PEOPLE.</span><strong>NO BOTS.</strong></div>
      <div className="auth-panel">
        <span className="eyebrow">{intent === "brand" ? "Become a Contender" : "Become a Collector"}</span>
        <h1>One account. Every side.</h1>
        <p>{intent === "brand" ? "Create your account, then enter Brand Arena to publish your first verified offer." : "Claim live deals now. The same account can manage a brand whenever you need it."}</p>
        <AuthForm mode="sign-up" nextPath={nextPath} />
        <p className="auth-switch">Already registered? <Link href={`/sign-in?${signInParams.toString()}`}>Sign in</Link></p>
      </div>
    </section>
  );
}
