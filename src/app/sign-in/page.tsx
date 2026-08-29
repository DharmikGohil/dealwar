import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { safeReturnPath } from "@/lib/safe-return-path";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; intent?: string }> }) {
  const query = await searchParams;
  const nextPath = safeReturnPath(query.next);
  if (await getCurrentUser()) redirect(nextPath);
  const intent = query.intent === "claim" ? "claim" : query.intent === "brand" ? "brand" : "account";
  const signUpParams = new URLSearchParams({ next: nextPath });
  if (intent !== "account") signUpParams.set("intent", intent);
  return (
    <section className="auth-page">
      <div className="auth-poster"><span>{intent === "brand" ? "BUILD." : "CLAIM."}</span><span>{intent === "brand" ? "COMPETE." : "COLLECT."}</span><strong>WIN.</strong></div>
      <div className="auth-panel">
        <span className="eyebrow">{intent === "claim" ? "Finish your claim" : intent === "brand" ? "Brand Arena access" : "Secure account access"}</span>
        <h1>{intent === "claim" ? "Your deal is waiting." : intent === "brand" ? "Enter Brand Arena." : "Welcome back."}</h1>
        <p>{intent === "claim" ? "Sign in and DealWar will return to the deal and secure your available code." : intent === "brand" ? "Use one DealWar account to publish offers, verify companies and manage payments." : "Sign in to see your claimed deals or manage your brand entries."}</p>
        <AuthForm mode="sign-in" nextPath={nextPath} />
        <p className="auth-switch">New here? <Link href={`/sign-up?${signUpParams.toString()}`}>Create an account</Link></p>
      </div>
    </section>
  );
}
