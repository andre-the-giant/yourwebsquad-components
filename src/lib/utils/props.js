// Utility to validate component props against a simple schema.
// Schema shape: { propName: { required?: boolean, type?: string | string[], validate?: (value) => boolean | string } }
// Known types: string | number | boolean | object | array | function

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
