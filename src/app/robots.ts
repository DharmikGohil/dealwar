import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/brand", "/dashboard", "/my-deals", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"] },
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
