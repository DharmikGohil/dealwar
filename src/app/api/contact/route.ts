import { z } from "zod";
import { ApiError, apiError, requestId } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestFingerprint } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  topic: z.enum(["general", "claim", "company", "privacy", "appeal", "security"]),
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const fingerprint = requestFingerprint(request);
    await enforceRateLimit({ key: `contact:${fingerprint.ipHash}`, limit: 4, windowSeconds: 3600 });
    const form = await request.formData();
    const input = schema.parse(Object.fromEntries(form));
    await sendEmail({
      to: env.SUPPORT_EMAIL,
      replyTo: input.email,
      subject: `[DealWar ${input.topic}] ${input.name}`,
      preview: input.message.slice(0, 140),
      heading: `${input.topic.toUpperCase()} message`,
      body: `From: ${input.name} (${input.email})\n\n${input.message}`,
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Transactional email is not configured.") {
      return apiError(new ApiError(503, "Support email is temporarily unavailable.", "email_unavailable"), id);
    }
    return apiError(error, id);
  }
}
