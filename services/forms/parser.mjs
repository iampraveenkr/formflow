function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 40);
}

export function normalizeQuestionType(question) {
  const sourceType = String(question.type ?? "TEXT").toUpperCase();

  switch (sourceType) {
    case "TEXT":
      return "text";
    case "PARAGRAPH_TEXT":
      return "multiline";
    case "EMAIL":
      return "email";
    case "NUMBER":
      return "number";
    case "DATE":
      return "date";
    case "MULTIPLE_CHOICE":
    case "CHECKBOX":
    case "DROPDOWN":
      return "choice";
    case "FILE_UPLOAD":
      return "file";
    case "BOOLEAN":
      return "boolean";
    default:
      return "text";
  }
}

export function parseGoogleFormSchema(schema) {
  const items = Array.isArray(schema.items) ? schema.items : [];
  const duplicateTracker = new Map();

  return items.map((item, index) => {
    const label = item.title ?? `Question ${index + 1}`;
    const baseKey = slugify(label || `field_${index + 1}`) || `field_${index + 1}`;
    const count = (duplicateTracker.get(baseKey) ?? 0) + 1;
    duplicateTracker.set(baseKey, count);

    return {
      externalFieldId: item.questionId ?? `q_${index + 1}`,
      label,
      description: item.description ?? null,
      normalizedType: normalizeQuestionType(item),
      required: Boolean(item.required),
      options: Array.isArray(item.options) ? item.options : [],
      stableKey: count > 1 ? `${baseKey}_${count}` : baseKey,
      removed: false
    };
  });
}

export function buildTestPayload(fields) {
  const payload = {};

  for (const field of fields) {
    switch (field.normalizedType) {
      case "text":
        payload[field.stableKey] = "Sample text";
        break;
      case "multiline":
        payload[field.stableKey] = "Sample multiline\ncontent";
        break;
      case "email":
        payload[field.stableKey] = "user@example.com";
        break;
      case "number":
        payload[field.stableKey] = 42;
        break;
      case "date":
        payload[field.stableKey] = "2026-01-01";
        break;
      case "choice":
        payload[field.stableKey] = field.options[0] ?? "choice_a";
        break;
      case "file":
        payload[field.stableKey] = { fileName: "sample.pdf", fileUrl: "https://example.com/sample.pdf" };
        break;
      case "boolean":
        payload[field.stableKey] = true;
        break;
      default:
        payload[field.stableKey] = null;
    }
  }

  return payload;
}
