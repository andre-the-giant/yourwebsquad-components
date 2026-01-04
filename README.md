<img src="https://yourwebsquad.com/_astro/yws_logo.CWnkdKQi_ZmYHFV.svg" width="400">

# My own little component library

Hey what's up ? So you found my little component library project ? I hope you like it!
Let me tell you more about it.

## Component authoring conventions

- **Content object:** each component accepts a `content` object for text, links, and simple data.
- **Props override order:** direct props win over `content` fields. Use sensible defaults inside the component.
- **Slots:** avoid `<slot />` unless a component cannot be expressed with `content` + props.
- **Required frontmatter comment:** every component must document its props and `content` shape.

Example frontmatter comment:

```astro
---
/*
Props:
- content?: { label?: string, href?: string, icon?: string }
- variant?: "solid" | "ghost"
- size?: "sm" | "md" | "lg"
Notes:
- direct props override content.*
*/
---
```

## Adding a new component

You can add new components manually or use the provided scaffolding script.

- Manual steps
  - Create the component in `src/lib/components/<ComponentName>/` with a primary `<ComponentName>.astro` and a small `index.astro` wrapper that imports and re-exports the component.
  - Add a docs page in `src/docs/pages/components/{atoms|molecules|components}/<slug>.astro` (use lower-case slug like `button`).
  - Add a small wrapper at `src/docs/pages/components/<slug>.astro` that imports the grouped page so the route `/components/<slug>` keeps working.
  - Add an entry to `src/docs/data/components.js`:

    {
    name: "ComponentName",
    href: "/components/component-slug",
    description: "Short description",
    group: "atoms" // or "molecules" or "components"
    }

- Scaffolding script (recommended)

You can run a small generator that will create the component files, the docs page, the wrapper route and append an entry to `src/docs/data/components.js`:

```bash
npm run create
```

The script will prompt for the component `name`, `group` (atoms|molecules|components), and a short `description`. You can also pass arguments non-interactively:

```bash
npm run create -- "Badge" atoms "Small inline badge"
```

Files created:

- `src/lib/components/<ComponentName>/<ComponentName>.astro`
- `src/lib/components/<ComponentName>/index.astro`
- `src/docs/pages/components/{group}/<slug>.astro`
- `src/docs/pages/components/<slug>.astro` (wrapper)
- `src/docs/data/components.js` (new entry appended)

Notes:

- The script is intentionally simple text-based scaffolding. You can customize the templates in `scripts/create-component.js`.
- After scaffolding, run `npm run format` to apply formatting.
