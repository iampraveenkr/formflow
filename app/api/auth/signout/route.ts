import { buildClearSessionCookie } from "@/lib/server/auth/session";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const response = NextResponse.redirect(`${url.origin}/login`);
  response.headers.set("Set-Cookie", buildClearSessionCookie());
  return response;
}
