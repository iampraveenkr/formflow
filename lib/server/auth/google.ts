import type { AuthenticatedUser } from "@/types/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function buildGoogleOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: mustEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: mustEnv("GOOGLE_OAUTH_REDIRECT_URI"),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForUser(code: string): Promise<AuthenticatedUser> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: mustEnv("GOOGLE_CLIENT_ID"),
      client_secret: mustEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: mustEnv("GOOGLE_OAUTH_REDIRECT_URI"),
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    throw new Error("OAuth token exchange failed");
  }

  const tokenJson = (await response.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Missing Google access token");
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`
    }
  });

  if (!userInfoResponse.ok) {
    throw new Error("Unable to fetch Google profile");
  }

  const userInfo = (await userInfoResponse.json()) as {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };

  return {
    id: userInfo.id,
    email: userInfo.email,
    fullName: userInfo.name ?? userInfo.email,
    avatarUrl: userInfo.picture ?? null
  };
}
