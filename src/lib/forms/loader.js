import { getCollection, getEntry } from "astro:content";
import { normalizeFormDefinition } from "./schema.js";

export async function loadFormDefinition({ formId, form } = {}) {
  if (!formId && !form) {
    throw new Error("Form requires either a formId or a form definition.");
  }

  if (form) {
    return normalizeFormDefinition(form, { fileId: form.id ?? formId });
  }

  const entry = await getEntry("forms", formId).catch(() => null);
  const resolvedEntry =
    entry ??
    (await getCollection("forms")
      .then((entries) =>
        entries.find((item) => {
          const id = item.id ?? "";
          const stem = id.split("/").pop()?.replace(/\.json$/i, "") ?? "";
          return id === formId || stem === formId;
        })
      )
      .catch(() => null));

  if (!resolvedEntry) {
    throw new Error(`Form "${formId}" not found in content collection "forms".`);
  }

  const fileId = (resolvedEntry.id ?? formId).split("/").pop()?.replace(/\.json$/i, "") ?? formId;
  return normalizeFormDefinition(resolvedEntry.data, { fileId });
}
