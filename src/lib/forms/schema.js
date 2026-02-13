import { z } from "zod";

const localizedString = z.union([
  z.string().min(1),
  z.record(z.string().min(1), z.string().min(1))
]);

const localizedOptional = z.union([z.string(), z.record(z.string().min(1), z.string())]);

// Field option schema for select/radio inputs
const fieldOptionSchema = z.object({
  value: z.string().min(1, "Option value is required"),
  label: localizedString,
  disabled: z.boolean().optional()
});

const fieldTypeEnum = z.enum([
  "text",
  "email",
  "textarea",
  "tel",
  "number",
  "checkbox",
  "radio",
  "select",
  "date",
  "hidden",
  "upload"
]);

const sanitizeEnum = z.enum(["none", "text", "email", "tel", "number"]);

const fieldSchema = z
  .object({
    name: z
      .string()
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_]*$/,
        "Field name must start with a letter and use letters, numbers, or underscores"
      ),
    label: localizedString,
    type: fieldTypeEnum,
    required: z.boolean().default(false),
    placeholder: localizedOptional.optional(),
    maxLength: z.number().int().positive().optional(),
    minLength: z.number().int().nonnegative().optional(),
    pattern: z.string().optional(),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    sanitize: sanitizeEnum.optional(),
    options: z.array(fieldOptionSchema).optional(),
    accept: z.string().optional(),
    imagesOnly: z.boolean().optional(),
    multiple: z.boolean().optional(),
    maxFiles: z.number().int().positive().optional(),
    maxFileSizeMb: z.number().positive().optional(),
    noFileText: localizedOptional.optional(),
    browseLabel: localizedOptional.optional(),
    removeLabel: localizedOptional.optional()
  })
  .superRefine((val, ctx) => {
    const hasUploadOptions =
      val.accept !== undefined ||
      val.imagesOnly !== undefined ||
      val.multiple !== undefined ||
      val.maxFiles !== undefined ||
      val.maxFileSizeMb !== undefined ||
      val.noFileText !== undefined ||
      val.browseLabel !== undefined ||
      val.removeLabel !== undefined;

    if (
      (val.type === "select" || val.type === "radio") &&
      (!val.options || val.options.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field "${val.name}": options are required for ${val.type} fields`
      });
    }

    if (val.options && !(val.type === "select" || val.type === "radio")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field "${val.name}": options are only allowed for select or radio fields`
      });
    }

    if (val.type !== "upload" && hasUploadOptions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field "${val.name}": accept, imagesOnly, multiple, maxFiles, maxFileSizeMb, noFileText, browseLabel, and removeLabel are only valid for upload fields`
      });
    }

    if (val.type === "upload" && val.sanitize && val.sanitize !== "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field "${val.name}": sanitize must be "none" for upload fields`
      });
    }

    if (val.type === "upload" && val.maxFiles && val.maxFiles > 1 && !val.multiple) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field "${val.name}": maxFiles > 1 requires multiple: true`
      });
    }

    if (val.pattern) {
      try {
        // eslint-disable-next-line no-new
        new RegExp(val.pattern);
      } catch (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Field "${val.name}": invalid regex pattern`
        });
      }
    }
  });

const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  from: z.string().email().optional(),
  replyToField: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "replyToField must match a field name")
    .optional(),
  subject: localizedString,
  intro: localizedOptional.optional()
});

const rateLimitSchema = z
  .object({
    windowSeconds: z.number().int().positive().default(60),
    max: z.number().int().positive().default(5)
  })
  .default({ windowSeconds: 60, max: 5 });

const honeypotSchema = z
  .object({
    name: z.string().min(1, "Honeypot field name is required").default("middle_name"),
    label: localizedOptional.optional(),
    enabled: z.boolean().default(true)
  })
  .default({ name: "middle_name", enabled: true });

const securitySchema = z
  .object({
    honeypot: honeypotSchema.default({ name: "middle_name", enabled: true }),
    rateLimit: rateLimitSchema.default({ windowSeconds: 60, max: 5 })
  })
  .default({
    honeypot: { name: "middle_name", enabled: true },
    rateLimit: { windowSeconds: 60, max: 5 }
  });

const formSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Form id must be kebab-case"),
  title: localizedString,
  endpoint: z.string().optional(),
  fields: z.array(fieldSchema).min(1, "At least one field is required"),
  email: emailSchema,
  security: securitySchema.optional()
});

const DEFAULT_ENDPOINT = (id) => `/api/${id}/`;
const DEFAULT_SECURITY = {
  honeypot: { name: "middle_name", enabled: true },
  rateLimit: { windowSeconds: 60, max: 5 }
};

function inferSanitize(type, explicit) {
  if (explicit) return explicit;
  switch (type) {
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "number":
      return "number";
    case "upload":
      return "none";
    default:
      return "text";
  }
}

function normalizeField(field) {
  return {
    ...field,
    required: field.required ?? false,
    sanitize: inferSanitize(field.type, field.sanitize)
  };
}

export function normalizeFormDefinition(raw, opts = {}) {
  const parsed = formSchema.parse(raw);

  if (opts.fileId && opts.fileId !== parsed.id) {
    throw new Error(`Form id "${parsed.id}" must match filename "${opts.fileId}"`);
  }

  const names = new Set();
  parsed.fields.forEach((field) => {
    if (names.has(field.name)) {
      throw new Error(`Duplicate field name "${field.name}" in form "${parsed.id}"`);
    }
    names.add(field.name);
  });

  const endpoint =
    parsed.endpoint && parsed.endpoint.trim() ? parsed.endpoint : DEFAULT_ENDPOINT(parsed.id);
  const security = {
    honeypot: {
      ...DEFAULT_SECURITY.honeypot,
      ...(parsed.security?.honeypot ?? {})
    },
    rateLimit: {
      ...DEFAULT_SECURITY.rateLimit,
      ...(parsed.security?.rateLimit ?? {})
    }
  };

  return {
    ...parsed,
    endpoint,
    security,
    fields: parsed.fields.map(normalizeField)
  };
}

export function resolveLocalized(value, locale) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (locale && value[locale]) return value[locale];
  const first = Object.values(value)[0];
  return typeof first === "string" ? first : undefined;
}

export function normalizeFormsCollection(definitions = [], opts = {}) {
  const ids = new Set();
  return definitions.map((entry) => {
    const form = normalizeFormDefinition(entry.data ?? entry, { fileId: entry.id ?? opts.fileId });
    if (ids.has(form.id)) {
      throw new Error(`Duplicate form id detected: "${form.id}"`);
    }
    ids.add(form.id);
    return form;
  });
}

export const schemas = {
  field: fieldSchema,
  email: emailSchema,
  security: securitySchema,
  form: formSchema
};
