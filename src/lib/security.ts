import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { env } from "@/lib/env";

const couponKey = Buffer.from(env.COUPON_ENCRYPTION_KEY, "hex");

export function keyedHash(scope: string, value: string) {
  return createHmac("sha256", env.ABUSE_HASH_SECRET)
    .update(scope)
    .update("\0")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function encryptCoupon(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", couponKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return {
    encryptedCode: ciphertext.toString("base64url"),
    encryptionIv: iv.toString("base64url"),
    encryptionTag: cipher.getAuthTag().toString("base64url"),
  };
}

export function decryptCoupon(input: {
  encryptedCode: string;
  encryptionIv: string;
  encryptionTag: string;
}) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    couponKey,
    Buffer.from(input.encryptionIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(input.encryptionTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(input.encryptedCode, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function couponHash(code: string) {
  return keyedHash("coupon", code);
}

export function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return {
    ipHash: keyedHash("ip", ip),
    userAgentHash: keyedHash("ua", userAgent),
  };
}
