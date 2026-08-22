import "server-only";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, objectStorageConfigured } from "@/lib/env";

const client = objectStorageConfigured
  ? new S3Client({
      region: env.OBJECT_STORAGE_REGION,
      endpoint: env.OBJECT_STORAGE_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const allowedLogoTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
export const maxLogoBytes = 2 * 1024 * 1024;

export async function createLogoUpload(input: {
  userId: string;
  contentType: string;
  extension: string;
}) {
  if (!client || !env.OBJECT_STORAGE_BUCKET || !env.OBJECT_STORAGE_PUBLIC_URL) {
    throw new Error("Object storage is not configured.");
  }
  const key = `logos/${input.userId}/${crypto.randomUUID()}.${input.extension}`;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: env.OBJECT_STORAGE_BUCKET,
      Key: key,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: 300 },
  );
  return {
    uploadUrl,
    publicUrl: `${env.OBJECT_STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${key}`,
  };
}

export function isOwnedLogoUrl(url: string, userId: string) {
  if (!objectStorageConfigured || !env.OBJECT_STORAGE_PUBLIC_URL) return false;
  try {
    const publicBase = new URL(env.OBJECT_STORAGE_PUBLIC_URL);
    const candidate = new URL(url);
    const basePath = publicBase.pathname.replace(/\/$/, "");
    return (
      candidate.protocol === "https:" &&
      candidate.origin === publicBase.origin &&
      candidate.pathname.startsWith(`${basePath}/logos/${userId}/`) &&
      !candidate.username &&
      !candidate.password &&
      !candidate.search &&
      !candidate.hash
    );
  } catch {
    return false;
  }
}

export async function assertOwnedLogoExists(url: string, userId: string) {
  if (!client || !env.OBJECT_STORAGE_BUCKET || !env.OBJECT_STORAGE_PUBLIC_URL || !isOwnedLogoUrl(url, userId)) {
    return false;
  }
  const base = new URL(env.OBJECT_STORAGE_PUBLIC_URL);
  const candidate = new URL(url);
  const basePath = base.pathname.replace(/^\//, "").replace(/\/$/, "");
  const candidatePath = candidate.pathname.replace(/^\//, "");
  const key = basePath ? candidatePath.slice(basePath.length + 1) : candidatePath;
  try {
    const object = await client.send(new HeadObjectCommand({ Bucket: env.OBJECT_STORAGE_BUCKET, Key: key }));
    return Boolean(object.ContentLength && object.ContentLength <= maxLogoBytes && object.ContentType && allowedLogoTypes.has(object.ContentType));
  } catch {
    return false;
  }
}
