import { getEntry } from "astro:content";
import { normalizeFormDefinition } from "./schema.js";

export async function loadFormDefinition({ formId, form } = {}) {
  if (!formId && !form) {
    throw new Error("Form requires either a formId or a form definition.");
  }

  if (form) {
    return normalizeFormDefinition(form, { fileId: form.id ?? formId });
  }

  const entry = await getEntry("forms", formId).catch(() => null);
  if (!entry) {
    throw new Error(`Form "${formId}" not found in content collection "forms".`);
  }

  return normalizeFormDefinition(entry.data, { fileId: entry.id ?? formId });
}
