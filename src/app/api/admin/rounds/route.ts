import { randomBytes } from "node:crypto";
import { z } from "zod";
import { ApiError, apiError, assertTrustedOrigin, requestId } from "@/lib/api";
import { requireApiRole } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { requestFingerprint } from "@/lib/security";
import { slugify } from "@/lib/slug";

const schema = z.object({
  name: z.string().trim().min(3).max(80),
  strapline: z.string().trim().min(8).max(160),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).superRefine((input, context) => {
  const duration = input.endsAt.getTime() - input.startsAt.getTime();
  if (duration < 3_600_000) context.addIssue({ code: "custom", path: ["endsAt"], message: "A round must run for at least one hour." });
  if (duration > 90 * 86_400_000) context.addIssue({ code: "custom", path: ["endsAt"], message: "A round cannot exceed 90 days." });
});

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    assertTrustedOrigin(request);
    const admin = await requireApiRole(["ADMIN"]);
    const input = schema.parse(await request.json());
    if (input.endsAt <= new Date()) throw new ApiError(422, "The round must end in the future.", "invalid_schedule");
    const overlap = await db.round.findFirst({ where: { status: { in: ["SCHEDULED", "LIVE"] }, startsAt: { lt: input.endsAt }, endsAt: { gt: input.startsAt } } });
    if (overlap) throw new ApiError(409, `This schedule overlaps ${overlap.name}.`, "round_overlap");
    const status = input.startsAt <= new Date() ? "LIVE" : "SCHEDULED";
    const round = await db.round.create({ data: { name: input.name, slug: `${slugify(input.name)}-${randomBytes(3).toString("hex")}`, strapline: input.strapline, startsAt: input.startsAt, endsAt: input.endsAt, status } });
    const fingerprint = requestFingerprint(request);
    await db.auditLog.create({ data: { actorId: admin.id, action: "round.created", targetType: "Round", targetId: round.id, requestId: id, ipHash: fingerprint.ipHash, metadata: { status, startsAt: input.startsAt.toISOString(), endsAt: input.endsAt.toISOString() } } });
    return Response.json({ round }, { status: 201 });
  } catch (error) {
    return apiError(error, id);
  }
}
