import { randomUUID } from "node:crypto";
import { buildGoogleOAuthUrl } from "@/lib/server/auth/google";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const state = randomUUID();
  const redirectUrl = buildGoogleOAuthUrl(state);

  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Set-Cookie", `formflow_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return response;
}
