import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RateLimitError } from "@/lib/rate-limit";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiError(error: unknown, requestId?: string) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message }, requestId },
      { status: error.status },
    );
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: error.message }, requestId },
      { status: 429, headers: { "Retry-After": String(error.retryAfter) } },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: { code: "invalid_input", message: "Some submitted fields are invalid." },
        fields: error.flatten().fieldErrors,
        requestId,
      },
      { status: 422 },
    );
  }
  console.error("Unhandled API error", { error, requestId });
  return NextResponse.json(
    { error: { code: "internal_error", message: "Something went wrong." }, requestId },
    { status: 500 },
  );
}

export function requestId(request: Request) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}
