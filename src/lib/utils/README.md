# Utils usage (pattern)

Use this snippet in components:

```astro
---
import { validateProps } from "../utils/props.js";
import { makeStyleVars, mergeClasses } from "../utils/style.js";

const schema = {
  id: { type: "string" },
  class: { type: "string" },
  style: { type: "string" }
  // ...component-specific props
};

const {
  id,
  class: className,
  style,
  ...rest
} = validateProps(schema, Astro.props, { component: "ComponentName" });

const resolvedId = id ?? "component-name-" + Math.random().toString(36).slice(2, 9);
const styleVars = {
  // "--component-bg": "var(--color-bg)",
};

const resolvedStyle = makeStyleVars(styleVars, style);
const resolvedClass = mergeClasses("component-name", className);
---
```

- Keep schemas strict; validation throws on invalid props.
- Prefer CSS vars in `styleVars` so consumers can override per instance.
- Keep `class` as `className` to avoid collisions.
