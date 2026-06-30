# Utils usage (pattern)

Components define their prop contract with a **zod schema** and parse it with
`parseProps` (validates + applies defaults, warns instead of throwing). Derive a
local `type Props` from the same schema so consumers get autocomplete.

```astro
---
import { z } from "zod";
import { parseProps } from "../utils/props.js";
import { nextId } from "../utils/id.js";
import { makeStyleVars, mergeClasses } from "../utils/style.js";

const Schema = z.looseObject({
  id: z.string().optional(),
  class: z.string().optional(),
  style: z.string().optional()
  // ...component-specific props, e.g.
  // variant: z.enum(["solid", "outline", "ghost"]).default("solid")
});

type Props = z.input<typeof Schema>;

const {
  id,
  class: className,
  style,
  ...rest
} = parseProps(Schema, Astro.props, { component: "ComponentName" });

const resolvedId = id ?? nextId("component-name");
const styleVars = {
  // "--component-bg": "var(--color-bg)",
};

const resolvedStyle = makeStyleVars(styleVars, style);
const resolvedClass = mergeClasses("component-name", className);
---
```

- Use `z.looseObject` (not `z.object`) so unknown attributes (`data-*`, `aria-*`)
  pass through to `...rest`.
- `parseProps` is resilient: on an invalid prop it warns in dev and falls back to
  defaults instead of throwing, so one bad prop can't crash a static build.
- Colors come from **tokens only** — never hardcode hex; reference semantic CSS vars
  (e.g. `var(--color-accent)`) so themes can restyle the component.
- Use `nextId(prefix)` for generated ids (deterministic, reproducible) — never
  `Math.random()`.
- Keep `class` as `className` to avoid collisions.
