import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function badRequest(message: string, code = "BAD_REQUEST", details?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: false, error: message, code, details: details ?? null }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ ok: false, error: message, code: "UNAUTHORIZED" }, { status: 401 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ ok: false, error: message, code: "NOT_FOUND" }, { status: 404 });
}

export function paymentRequired(message: string, code = "PLAN_LIMIT", details?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: false, error: message, code, details: details ?? null }, { status: 402 });
}

export function internalError(message = "Internal server error", details?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: false, error: message, code: "INTERNAL_ERROR", details: details ?? null }, { status: 500 });
}
