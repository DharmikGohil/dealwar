import { redirect } from "next/navigation";

export default async function LegacyDealStatusPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const payment = query.payment === "return" || query.payment === "cancelled" ? `?payment=${query.payment}` : "";
  redirect(`/brand/entries/${encodeURIComponent(id)}${payment}`);
}
