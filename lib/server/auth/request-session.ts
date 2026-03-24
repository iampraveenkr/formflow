import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth/session";
import type { SessionPayload } from "@/types/auth";

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, chunk) => {
    const [rawName, ...rawValueParts] = chunk.trim().split("=");
    if (!rawName || rawValueParts.length === 0) {
      return accumulator;
    }
    accumulator[rawName] = rawValueParts.join("=");
    return accumulator;
  }, {});
}

export function getSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  const cookies = parseCookieHeader(cookieHeader);
  return parseSessionToken(cookies[SESSION_COOKIE_NAME]);
}
