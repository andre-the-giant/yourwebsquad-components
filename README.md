<img src="https://yourwebsquad.com/img/logo-black-square.png" width="200">

# My own little component library

Hey what's up ? So you found my little component library project ? 

I hope you like it!

Let me tell you more about it.

## Component authoring conventions

- **Props only:** expose explicit props. Keep the prop surface small and focused.
- **Slots:** avoid `<slot />` unless a component cannot be expressed with props alone.
- **Required frontmatter comment:** every component must document its props and defaults.
- running the project with `npm run dev` will allow you to browse the docs. Each component page has a table of all props and default values. 

Example frontmatter comment:

```astro
---
/*
Props:
- variant?: "solid" | "ghost"
- size?: "sm" | "md" | "lg"
- label?: string
- href?: string
Notes:
- keep props minimal and explicit
*/
---
```

## Adding a new component

You can add new components manually or use the provided scaffolding script.

### Scaffolding script (recommended)

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

- The script is intentionally simple text-based scaffolding. 

You can customize the templates in `scripts/create-component.js`.
- After scaffolding, run `npm run format` to apply formatting.

### Manual steps
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

## Releasing (version bump + tag)

Use the release helper to bump the package version, add a commit, and push an annotated tag:

```bash
npm run bumpitup
```

What it does:

- Prompts for patch/minor/major (based on current version) and a short tag note (entered inline in the terminal).
- Requires: on `main`, clean working tree, and a configured git remote.
- Updates `package.json` with the chosen version, runs `npm run format` and `npm run build` quietly (only shows output on failure), then commits, tags (`vX.Y.Z` with your note), and pushes branch + tag.

Tips:

- Keep the note brief (single sentence); it’s reused for the commit and tag message.
- If you need a different branch name requirement, tweak `ensureOnBranch` in `scripts/bumpitup.js`.
