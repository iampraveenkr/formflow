const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/g;

function lookupPath(payload, path) {
  const parts = path.split(".");
  let current = payload;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) return undefined;
    current = current[part];
  }
  return current;
}

export function resolveTemplateString(template, payload) {
  const missing = [];
  const resolved = String(template ?? "").replace(VARIABLE_PATTERN, (_, key) => {
    const value = lookupPath(payload ?? {}, key);
    if (value === undefined || value === null) {
      missing.push(key);
      return "";
    }
    return String(value);
  });

  return { resolved, missingVariables: missing };
}

export function resolveTemplateObject(input, payload) {
  if (typeof input === "string") return resolveTemplateString(input, payload);
  if (Array.isArray(input)) {
    const allMissing = [];
    const resolved = input.map((item) => {
      const out = resolveTemplateObject(item, payload);
      allMissing.push(...out.missingVariables);
      return out.resolved;
    });
    return { resolved, missingVariables: allMissing };
  }
  if (input && typeof input === "object") {
    const allMissing = [];
    const resolved = Object.fromEntries(
      Object.entries(input).map(([key, value]) => {
        const out = resolveTemplateObject(value, payload);
        allMissing.push(...out.missingVariables);
        return [key, out.resolved];
      })
    );
    return { resolved, missingVariables: allMissing };
  }
  return { resolved: input, missingVariables: [] };
}
