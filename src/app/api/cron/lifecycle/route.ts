import { ApiError, apiError, requestId } from "@/lib/api";
import { env } from "@/lib/env";
import { reconcileLifecycle } from "@/lib/lifecycle";
import { secureEquals } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    const authorization = request.headers.get("authorization");
    const supplied = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!supplied || !secureEquals(supplied, env.CRON_SECRET)) {
      throw new ApiError(401, "Invalid scheduler credential.", "unauthorized");
    }
    const result = await reconcileLifecycle(id, true);
    return Response.json({ ok: true, ...result, at: result.at.toISOString() });
  } catch (error) {
    return apiError(error, id);
  }
}
