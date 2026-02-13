import { defineCollection, z } from "astro:content";

const optionSchema = z.object({
  value: z.string(),
  label: z.union([z.string(), z.record(z.string(), z.string())]),
  disabled: z.boolean().optional()
});

const fieldSchema = z
  .object({
    name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
    label: z.union([z.string(), z.record(z.string(), z.string())]),
    type: z.enum([
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
    ]),
    required: z.boolean().default(false),
    placeholder: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
    maxLength: z.number().int().positive().optional(),
    minLength: z.number().int().nonnegative().optional(),
    pattern: z.string().optional(),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    sanitize: z.enum(["none", "text", "email", "tel", "number"]).optional(),
    options: z.array(optionSchema).optional(),
    accept: z.string().optional(),
    imagesOnly: z.boolean().optional(),
    multiple: z.boolean().optional(),
    maxFiles: z.number().int().positive().optional(),
    maxFileSizeMb: z.number().positive().optional(),
    noFileText: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
    browseLabel: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
    removeLabel: z.union([z.string(), z.record(z.string(), z.string())]).optional()
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
        message: "Select and radio fields require options."
      });
    }
    if (val.options && !(val.type === "select" || val.type === "radio")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Options are only allowed for select or radio types."
      });
    }

    if (val.type !== "upload" && hasUploadOptions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "accept, imagesOnly, multiple, maxFiles, maxFileSizeMb, noFileText, browseLabel, and removeLabel are only allowed for upload type."
      });
    }

    if (val.type === "upload" && val.sanitize && val.sanitize !== "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Upload fields require sanitize: none (or omit sanitize)."
      });
    }

    if (val.type === "upload" && val.maxFiles && val.maxFiles > 1 && !val.multiple) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "maxFiles > 1 requires multiple: true for upload fields."
      });
    }
  });

const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  from: z.string().email().optional(),
  replyToField: z.string().optional(),
  subject: z.union([z.string(), z.record(z.string(), z.string())]),
  intro: z.union([z.string(), z.record(z.string(), z.string())]).optional()
});

const rateLimitSchema = z.object({
  windowSeconds: z.number().int().positive().default(60),
  max: z.number().int().positive().default(5)
});

const honeypotSchema = z.object({
  name: z.string().default("middle_name"),
  label: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
  enabled: z.boolean().default(true)
});

const securitySchema = z.object({
  honeypot: honeypotSchema.default({ name: "middle_name", enabled: true }),
  rateLimit: rateLimitSchema.default({ windowSeconds: 60, max: 5 })
});

const forms = defineCollection({
  type: "data",
  schema: z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.union([z.string(), z.record(z.string(), z.string())]),
    endpoint: z.string().optional(),
    fields: z.array(fieldSchema),
    email: emailSchema,
    security: securitySchema.optional()
  })
});

export const collections = { forms };
