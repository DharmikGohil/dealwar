import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "DealWar — Companies compete. Customers collect.",
    template: "%s — DealWar",
  },
  description:
    "The live deal leaderboard where companies compete by committing more verified customer credit.",
  openGraph: {
    type: "website",
    title: "DealWar",
    description: "Companies compete. Customers collect.",
    siteName: "DealWar",
  },
  twitter: {
    card: "summary_large_image",
    title: "DealWar",
    description: "Companies compete. Customers collect.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ff4f1f",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
