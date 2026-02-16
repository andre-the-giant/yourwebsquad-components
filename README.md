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

## Forms integration (Astro + PHP endpoints)

The library exposes a `<Form>` component plus an Astro integration that generates PHP endpoints at build time.

### Quick setup

1. Install the library (as a dependency) and add the integration:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import yourwebsquadForms from "yourwebsquad-components/forms-integration";

export default defineConfig({
  outDir: "build",
  integrations: [
    yourwebsquadForms({ allowOrigins: ["yourwebsquad.com", "playground.yourwebsquad.com"] })
  ]
});
```

2. Define a `forms` content collection in your project:

```ts
// src/content/config.ts
import { defineCollection } from "astro:content";
import { formCollectionSchema } from "yourwebsquad-components/forms-content-schema";

const forms = defineCollection({
  type: "data",
  schema: formCollectionSchema
});

export const collections = { forms };
```

3. Add form entries in `src/content/forms/*.json`:

```json
{
  "id": "contact",
  "title": { "en": "Contact us", "fr": "Contactez-nous" },
  "fields": [
    { "name": "name", "label": { "en": "Name", "fr": "Nom" }, "type": "text", "required": true },
    {
      "name": "email",
      "label": { "en": "Email", "fr": "Email" },
      "type": "email",
      "required": true
    },
    {
      "name": "middle_name",
      "label": { "en": "Leave blank", "fr": "Laissez ce champ vide" },
      "type": "hidden"
    },
    {
      "name": "reference_images",
      "label": { "en": "Reference images", "fr": "Images de référence" },
      "type": "upload",
      "accept": "image/*",
      "imagesOnly": true,
      "multiple": true,
      "maxFiles": 3,
      "maxFileSizeMb": 5,
      "noFileText": { "en": "No image selected", "fr": "Aucune image sélectionnée" },
      "browseLabel": { "en": "Choose images", "fr": "Choisir des images" },
      "removeLabel": { "en": "Remove", "fr": "Retirer" },
      "filesSelectedText": {
        "en": "{count} files selected",
        "fr": "{count} fichiers sélectionnés"
      },
      "previewUnavailableText": { "en": "Preview unavailable", "fr": "Aperçu indisponible" }
    }
  ],
  "email": {
    "to": ["hello@example.com"],
    "subject": { "en": "New inquiry from ${name}", "fr": "Nouvelle demande de ${name}" },
    "replyToField": "email"
  },
  "security": {
    "honeypot": { "name": "middle_name", "enabled": true },
    "rateLimit": { "max": 5, "windowSeconds": 60 }
  },
  "messages": {
    "alertClientTitle": {
      "en": "Please fix the highlighted fields",
      "fr": "Merci de corriger les champs en erreur"
    },
    "alertServerTitle": { "en": "Something went wrong", "fr": "Une erreur est survenue" },
    "alertSuccessTitle": { "en": "Success", "fr": "Succès" },
    "successMessage": {
      "en": "Thanks! Your message was sent.",
      "fr": "Merci, votre message a été envoyé."
    },
    "submitLoadingLabel": { "en": "Sending...", "fr": "Envoi en cours..." },
    "submitLoadingAria": {
      "en": "Form is submitting, please wait.",
      "fr": "Le formulaire est en cours d'envoi, merci de patienter."
    },
    "fieldErrorSeparator": { "en": " - ", "fr": " - " },
    "validationInvalidFormat": { "en": "Invalid format.", "fr": "Format invalide." },
    "uploadTooManyFiles": {
      "en": "Please select at most {max} files.",
      "fr": "Veuillez sélectionner au maximum {max} fichiers."
    }
  }
}
```

4. Render in pages:

```astro
---
import { Form } from "yourwebsquad-components";
---

<Form formId="contact" locale="en" />
```

During `astro build`, the integration emits `/build/api/<formId>/index.php` with POST-only JSON responses, honeypot, validation, and rate limiting baked in.

### What gets generated

- Files are written to `build/api/<formId>/index.php`
- Only POST is allowed; other methods return 405
- Responses: `{ ok: boolean, message: string, errors?: Record<string,string> }`
- Honeypot: empty success without sending mail when filled
- Rate limiting: default 5 requests per 60s (configurable per form)
- Phone fields (`type: "tel"`) get a default server validation pattern `^[0-9+()\\-\\s]{6,20}$` if none is provided.
- Upload fields (`type: "upload"`) default to `imagesOnly: true`, reject dangerous/script-like file extensions and MIME types, and attach validated uploads to the outgoing email.
- Upload UI text is localizable via `noFileText`, `browseLabel`, `removeLabel`, `filesSelectedText`, and `previewUnavailableText`.

### Client usage tips

- `<Form>` resolves fields from the content entry; render with `formId` (preferred) or pass a preloaded `form` object.
- The form auto-injects the honeypot from `security.honeypot`.
- Frontend UX uses alerts: warning for client validation, error for server errors, success replaces the form, and each alert row is keyboard-focusable to jump to its field.
- Form-level i18n messages can be configured via `messages` (alert titles, success text, loading labels, validation/upload messages, and field error separator).

### Deployment

- Ensure your hosting serves the built `build/` directory with PHP enabled.
- Do not commit the generated `build/api` PHP files; they are created during CI/CD build.
