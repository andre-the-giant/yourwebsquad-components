// Convert a map of CSS variables to a single inline style string.
// Example: makeStyleVars({ "--btn-bg": "red" }, "color: blue") => "--btn-bg: red; color: blue"
export function makeStyleVars(styleVars = {}, inlineStyle) {
  const varString = Object.entries(styleVars)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
  return [varString, inlineStyle].filter(Boolean).join("; ");
}

// Merge class names safely, ignoring falsy values.
export function mergeClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}
