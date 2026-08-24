import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  adminEmails,
  emailConfigured,
  env,
  objectStorageConfigured,
  paymentsConfigured,
  paymentsReady,
} from "@/lib/env";

export async function GET() {
  const started = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const services = {
      database: "ok",
      payments: paymentsConfigured ? "configured" : env.PAYMENTS_ENABLED ? "missing" : "disabled",
      email: emailConfigured ? "configured" : "missing",
      objectStorage: objectStorageConfigured ? "configured" : "missing",
      operatorAccess: adminEmails.size > 0 ? "configured" : "missing",
    };
    const ready = env.NODE_ENV !== "production" || (paymentsReady && emailConfigured && objectStorageConfigured);
    return NextResponse.json(
      { status: ready ? "ok" : "degraded", ...services, latencyMs: Math.round(performance.now() - started) },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
