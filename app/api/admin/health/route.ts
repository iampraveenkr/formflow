import { internalError, ok, unauthorized } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const configuredKey = process.env.ADMIN_API_KEY;
  const provided = request.headers.get("x-admin-key");

  if (!configuredKey || provided !== configuredKey) {
    return unauthorized("Admin access required.");
  }

  try {
    return ok({
      status: "ok",
      service: "formflow-admin",
      timestamp: new Date().toISOString(),
      checks: {
        env: Boolean(process.env.SESSION_SECRET),
        node: process.version
      }
    });
  } catch (error) {
    return internalError("Failed to compute admin health.", {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
