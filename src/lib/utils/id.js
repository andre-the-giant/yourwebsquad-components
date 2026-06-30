// Deterministic, collision-free element IDs.
//
// Replaces `Math.random()`-based IDs. A monotonic per-prefix counter makes
// builds reproducible (stable snapshots/diffs) and guarantees uniqueness for
// the IDs that wire `<label for>` ↔ `<input id>`, `aria-describedby`, etc.
// Astro `.astro` components are rendered once at build time and not hydrated,
// so there is no client/server mismatch to worry about.
//
//   import { nextId } from "../../utils/id.js";
//   const fieldId = id ?? nextId("form-input");   // -> "form-input-1", "form-input-2", …

const counters = new Map();

/**
 * @param {string} [prefix]
 * @returns {string}
 */
export function nextId(prefix = "id") {
  const n = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, n);
  return `${prefix}-${n}`;
}
