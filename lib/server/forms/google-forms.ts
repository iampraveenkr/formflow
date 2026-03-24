import { createHash, randomUUID } from "node:crypto";
import { parseGoogleFormSchema } from "@/services/forms/parser";
import type { GoogleFormListItem } from "@/types/forms";

function hashSchema(schema: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(schema)).digest("hex");
}

export async function listAccessibleGoogleForms(): Promise<GoogleFormListItem[]> {
  if (process.env.GOOGLE_MOCK_MODE === "true") {
    return [
      { googleFormId: "mock_form_1", title: "Mock Customer Intake" },
      { googleFormId: "mock_form_2", title: "Mock Support Request" }
    ];
  }

  // Safe default: in non-mock mode we return empty until real Forms API client is configured.
  return [];
}

export async function fetchGoogleFormSchema(googleFormId: string): Promise<{ schema: Record<string, unknown>; hash: string }> {
  let schema: Record<string, unknown>;

  if (process.env.GOOGLE_MOCK_MODE === "true") {
    schema = {
      formId: googleFormId,
      title: googleFormId === "mock_form_1" ? "Mock Customer Intake" : "Mock Support Request",
      items: [
        { questionId: "q_name", title: "Full Name", type: "TEXT", required: true },
        { questionId: "q_email", title: "Email", type: "EMAIL", required: true },
        { questionId: "q_priority", title: "Priority", type: "MULTIPLE_CHOICE", options: ["Low", "Medium", "High"] }
      ]
    };
  } else {
    schema = { formId: googleFormId, title: "Unknown Form", items: [] };
  }

  return { schema, hash: hashSchema(schema) };
}

export async function normalizeGoogleForm(googleFormId: string): Promise<{
  formRecord: {
    id: string;
    googleFormId: string;
    title: string;
    schemaJson: Record<string, unknown>;
    schemaVersionHash: string;
    lastSyncedAt: string;
  };
  fields: ReturnType<typeof parseGoogleFormSchema>;
}> {
  const { schema, hash } = await fetchGoogleFormSchema(googleFormId);
  const fields = parseGoogleFormSchema(schema);

  return {
    formRecord: {
      id: `form_${randomUUID()}`,
      googleFormId,
      title: String(schema.title ?? "Untitled Form"),
      schemaJson: schema,
      schemaVersionHash: hash,
      lastSyncedAt: new Date().toISOString()
    },
    fields
  };
}
