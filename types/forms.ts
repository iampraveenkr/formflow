export type InternalFieldType = "text" | "number" | "email" | "date" | "choice" | "multiline" | "file" | "boolean";

export interface GoogleFormListItem {
  googleFormId: string;
  title: string;
}

export interface NormalizedFormField {
  externalFieldId: string;
  label: string;
  description: string | null;
  normalizedType: InternalFieldType;
  required: boolean;
  options: string[];
  stableKey: string;
  removed: boolean;
}

export interface CachedForm {
  id: string;
  workspaceId: string;
  googleFormId: string;
  title: string;
  schemaJson: Record<string, unknown>;
  schemaVersionHash: string;
  lastSyncedAt: string;
}
