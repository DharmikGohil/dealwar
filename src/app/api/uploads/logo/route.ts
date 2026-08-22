import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ApiError, apiError, requestId } from "@/lib/api";
import { objectStorageConfigured } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestFingerprint } from "@/lib/security";
import { allowedLogoTypes, createLogoUpload, maxLogoBytes } from "@/lib/storage";

const requestSchema = z.object({
  contentType: z.string(),
  size: z.number().int().positive().max(maxLogoBytes),
});

const extensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    if (!objectStorageConfigured) {
      throw new ApiError(503, "Logo uploads are not configured.", "storage_unavailable");
    }
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new ApiError(401, "Sign in to upload a logo.", "unauthorized");
    const fingerprint = requestFingerprint(request);
    await enforceRateLimit({ key: `logo:${session.user.id}:${fingerprint.ipHash}`, limit: 12, windowSeconds: 3600 });
    const input = requestSchema.parse(await request.json());
    const extension = extensions[input.contentType];
    if (!allowedLogoTypes.has(input.contentType) || !extension) {
      throw new ApiError(415, "Use a PNG, JPEG, or WebP image.", "unsupported_media_type");
    }
    const result = await createLogoUpload({
      userId: session.user.id,
      contentType: input.contentType,
      extension,
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error, id);
  }
}
