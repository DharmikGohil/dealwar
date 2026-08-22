import type { ReactNode } from "react";

export function LegalPage({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="legal-page">
      <header><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{intro}</p></header>
      <article className="legal-copy">{children}</article>
    </section>
  );
}
