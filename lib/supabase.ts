import { env } from "@/lib/env";

export interface SupabaseRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

// Milestone scaffold default: lightweight HTTP client wrapper.
// We use fetch directly until a full data access layer is implemented.
export async function supabaseRequest(path: string, options: SupabaseRequestOptions = {}): Promise<Response> {
  const method = options.method ?? "GET";

  return fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
}
