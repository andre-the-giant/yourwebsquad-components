// Component prop parsing & validation.
//
// `parseProps` (preferred) validates `Astro.props` against a zod schema, applies
// schema defaults, and is *resilient*: on invalid input it warns in dev and
// returns a best-effort value instead of throwing, so one bad prop can never
// crash a static build. Pair it with a component-local `type Props` derived from
// the same schema for consumer autocomplete:
//
//   import { z } from "zod";
//   import { parseProps } from "../../utils/props.js";
//   const Schema = z.object({ variant: z.enum(["solid","ghost"]).default("solid") });
//   type Props = z.input<typeof Schema>;            // what consumers may pass
//   const { variant } = parseProps(Schema, Astro.props, { component: "Button" });
//
// `validateProps` is the legacy object-schema validator kept only until every
// component is migrated to zod. Do not use it in new components.

const isDev =
  (typeof import.meta !== "undefined" && import.meta.env?.DEV) ??
  (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");

/**
 * Validate & coerce props against a zod schema without throwing on render.
 *
 * @template {import("zod").ZodTypeAny} TSchema
 * @param {TSchema} schema
 * @param {unknown} props
 * @param {{ component?: string }} [opts]
 * @returns {import("zod").output<TSchema>}
 */
export function parseProps(schema, props = {}, opts = {}) {
  const result = schema.safeParse(props);
  if (result.success) return result.data;

  const scope = opts.component ? `[${opts.component}] ` : "";
  if (isDev) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    console.warn(`${scope}invalid props — ${issues}`);
  }

  // Best effort: drop the offending top-level keys and re-parse so the rest of
  // the props plus schema defaults still flow through and the component renders.
  const cleaned = { ...(props && typeof props === "object" ? props : {}) };
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key != null) delete cleaned[key];
  }
  const retry = schema.safeParse(cleaned);
  return retry.success ? retry.data : cleaned;
}

// ---------------------------------------------------------------------------
// Legacy object-schema validator (deprecated — migrate components to zod).
// Schema shape: { propName: { required?, type?: string | string[], validate? } }
// ---------------------------------------------------------------------------

const validators = {
  string: (value) => typeof value === "string",
  number: (value) => typeof value === "number" && !Number.isNaN(value),
  boolean: (value) => typeof value === "boolean",
  object: (value) => value !== null && typeof value === "object" && !Array.isArray(value),
  array: (value) => Array.isArray(value),
  function: (value) => typeof value === "function"
};

function matchesType(expected, value) {
  const checks = Array.isArray(expected) ? expected : [expected];
  return checks.some((type) => validators[type]?.(value));
}

/** @deprecated Use {@link parseProps} with a zod schema instead. */
export function validateProps(schema = {}, props = {}, opts = {}) {
  const errors = [];
  const scope = opts.component ? `${opts.component}: ` : "";

  for (const [key, rule] of Object.entries(schema)) {
    const value = props[key];
    const { required = false, type, validate } = rule || {};

    if (required && (value === undefined || value === null)) {
      errors.push(`${scope}Missing required prop: ${key}`);
      continue;
    }
    if (value === undefined || value === null) continue;

    if (type && !matchesType(type, value)) {
      const expected = Array.isArray(type) ? type.join(" | ") : type;
      errors.push(`${scope}Prop "${key}" expected type ${expected}`);
    }

    if (typeof validate === "function") {
      const result = validate(value);
      if (result === false) {
        errors.push(`${scope}Prop "${key}" failed custom validation`);
      } else if (typeof result === "string") {
        errors.push(`${scope}Prop "${key}": ${result}`);
      }
    }
  }

  if (errors.length) {
    throw new Error(`Invalid props: ${errors.join("; ")}`);
  }

  return props;
}
