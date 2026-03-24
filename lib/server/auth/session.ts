import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionPayload } from "@/types/auth";

const COOKIE_NAME = "formflow_session";
const ONE_DAY_SECONDS = 60 * 60 * 24;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set and at least 16 characters.");
  }
  return secret;
}

function toBase64(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "issuedAt" | "expiresAt">): string {
  const now = Math.floor(Date.now() / 1000);
  const completePayload: SessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + ONE_DAY_SECONDS
  };
  const encoded = toBase64(JSON.stringify(completePayload));
  return `${encoded}.${sign(encoded)}`;
}

export function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encoded, tokenSignature] = token.split(".");
  if (!encoded || !tokenSignature) {
    return null;
  }

  const expected = sign(encoded);
  const a = Buffer.from(tokenSignature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64(encoded)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt <= now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ONE_DAY_SECONDS}`;
}

export function buildClearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
