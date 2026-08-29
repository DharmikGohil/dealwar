import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const deals = await db.deal.findMany({
    where: { status: { in: ["LIVE", "ENDED"] } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });
  const base = env.NEXT_PUBLIC_APP_URL;
  const staticPages = ["", "/brands", "/rules", "/about", "/privacy", "/terms", "/contact"];
  return [
    ...staticPages.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "hourly" as const : "monthly" as const, priority: path === "" ? 1 : .5 })),
    ...deals.map((deal) => ({ url: `${base}/deals/${deal.slug}`, lastModified: deal.updatedAt, changeFrequency: "daily" as const, priority: .8 })),
  ];
}
