# yourwebsquad-components — Major Update Plan (v3)

## Context

`yourwebsquad-components` is a private Astro component library (v2.4.1, ~6 months old,
28 published components) consumed by your Astro projects via git/path reference. The
foundation is genuinely good: design tokens with RGB-channel alpha mixing, a CLI
scaffolder (`scripts/create-component.js`), a `bumpitup` release script, a native
`<dialog>`-based Modal, and clear WCAG awareness (the git log shows deliberate a11y
fixes and correct handling of WCAG 1.4.13 in Tooltip).

But six months of organic growth has accumulated debt that now blocks the next stage:

- **No type safety.** Component contracts are enforced by a hand-rolled runtime
  validator (`src/lib/utils/props.js`) that _throws on render_ — one bad prop can crash
  a whole static build. There is no editor autocomplete for consumers.
- **A duplicated, partly-broken export layer.** Every component has a passthrough
  `index.astro` (`<Component {...props} />`) that, in several cases, **drops slotted
  children** (e.g. `Form/index.astro`). Meanwhile `lib/index.js` imports some components
  from `Component.astro` and others from `index.astro` — two inconsistent public APIs.
- **Theming is blocked** by hardcoded hex colors (`Modal`, `Tooltip`) that bypass the
  token system.
- **No automated guardrails** — no tests, no linting, no a11y checks, no `astro check`.
  WCAG fixes are reactive, with nothing preventing regressions.
- **Concrete a11y bugs and one functional bug** found during review (see Findings).

**Goal:** a v3 that is type-safe (zod-based), consistently structured, accessibility-
guardrailed, theme-ready, and AI-assisted in development — while keeping the public
component import names stable so consuming projects need minimal changes.

### Decisions locked with the user

| Area         | Decision                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Props/typing | **Zod schemas** — single source of truth → infer TS types + runtime validation. Unifies with the existing `forms-content-schema.js` (already zod). |
| Theming      | **Tokens cleanup + make theme-ready. Do NOT ship a dark theme yet.**                                                                               |
| Distribution | **Stay private, git/path-based** (keep `bumpitup` + git tags). No registry/publish work.                                                           |

---

## Findings (what prompted this update)

### Architecture / cross-cutting

| #   | Issue                                                                                                                                                     | Severity | Evidence                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| A1  | Hand-rolled runtime `validateProps` that **throws** instead of TS/zod types                                                                               | High     | `src/lib/utils/props.js`; used in every component                          |
| A2  | Passthrough `index.astro` wrappers — redundant, and **drop slotted children**                                                                             | High     | `Form/index.astro` = `<Form {...props} />` with no `<slot/>`               |
| A3  | Two inconsistent public APIs: `index.js` barrel vs `exports["./*"]` subpath                                                                               | Medium   | `src/lib/index.js` mixes `Button.astro` and `index.astro` sources          |
| A4  | No tests, no ESLint, no `astro check`, no a11y automation in CI                                                                                           | High     | `package.json`, `.github/workflows/main.yml` (build + FTP only)            |
| A5  | `Math.random()` IDs everywhere → non-reproducible builds, collision risk on the very IDs used for label↔input wiring                                      | Medium   | all components, e.g. `Modal.astro:37`                                      |
| A6  | Atomic-design taxonomy exists only in `docs/`, not `lib/` (flat); third tier mis-named "components" → self-referential `docs/pages/components/components` | Low      | `scripts/create-component.js` groups, `src/docs/pages/components/`         |
| A7  | Inconsistent component API styles (flat props vs `content={{…}}` objects) — leftover from a refactor                                                      | Medium   | `Link.astro` passes `content={{name}}` to `Icon` which expects flat `name` |
| A8  | CI deploys docs via FTP with `dangerous-clean-slate: true`, no quality gate before deploy                                                                 | Medium   | `.github/workflows/main.yml`                                               |

### Component-level a11y / bugs

| #   | Component              | Issue                                                                                                                                                | WCAG / type        |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| C1  | **Link**               | Passes `content={{name:"external"}}` to Icon (API is flat `name`) → renders fallback "spark" icon, not an external-link glyph                        | **Functional bug** |
| C2  | **Image**              | `alt=""` **default** → every image decorative-by-default; guaranteed missing alt across projects                                                     | 1.1.1              |
| C3  | **Image**              | `fetchpriority="high"` AND `loading="lazy"` defaults on every image; contradictory, hurts LCP/CWV                                                    | Perf               |
| C4  | **Image**              | Baked-in remote `picsum.photos` placeholder as default `src`                                                                                         | Smell/privacy      |
| C5  | **Accordion**          | No-JS = content unreachable (panels collapsed in CSS, expansion only in client JS)                                                                   | 1.3.1 / robustness |
| C6  | **Accordion**          | Closed panels get `aria-hidden="true"` but their links stay focusable → focusable-inside-aria-hidden                                                 | 4.1.2              |
| C7  | **Button**             | `disabled` on the anchor (`href`) variant only sets `aria-disabled` — link still focusable & follows href                                            | 4.1.2 / behavior   |
| C8  | **Form-Label**         | `visuallyHidden` + `tag="span"` sets `aria-hidden` on the wrapper → label hidden from SR too                                                         | 1.3.1 / 4.1.2      |
| C9  | **Form-Error**         | Sets both `role="alert"` and `aria-live="polite"` (contradictory)                                                                                    | 4.1.3              |
| C10 | **Forms**              | No composed `Field` — consumer manually syncs `helpId`/`errorId`/`ariaInvalid`/`aria-describedby` across 3 components                                | 1.3.1 / 3.3.1      |
| C11 | **Alert**              | `soft` tone uses raw hue as text color on 7% tint → warning/success ≈ 3.4:1                                                                          | 1.4.3              |
| C12 | **Tooltip**            | Relies on `:focus-within`; if `trigger` slot content isn't focusable, no keyboard/SR access                                                          | 2.1.1              |
| C13 | **Modal**, **Tooltip** | Hardcoded hex (`#fff`, `#111827`, `#111`) bypass tokens → can't theme                                                                                | Theming            |
| C14 | **Icon**               | `sanitizeSvgString()` strips only fill/stroke/style, not `<script>`/`on*`, then `set:html` → stored-XSS risk if `svg`/`svgPath` ever come from a CMS | **Security**       |

> Note: items C5–C14 are mostly _subtle_ — the components are well-built. The recurring
> root causes are A1 (no type contract), A5 (random IDs), and hardcoded colors (C13).

---

## Workstreams

Ordered by dependency. Each is independently shippable behind the v3 milestone.

### WS1 — Typing & validation (zod) _(foundation)_

- Add a shared helper `src/lib/utils/props.js` → replace `validateProps` with
  `parseProps(schema, Astro.props, { component })` that calls `schema.safeParse()` and,
  on failure, **`console.warn`s in dev and coerces to defaults** rather than throwing
  (avoids one bad prop killing a static build — a deliberate change from today's throw).
- Per-component pattern (define once, reuse everywhere):
  ```astro
  ---
  import { z } from "zod";
  import { parseProps } from "../../utils/props.js";
  const Schema = z.object({
    id: z.string().optional(),
    class: z.string().optional(),
    variant: z.enum(["solid", "outline", "ghost"]).default("solid")
    // ...
  });
  export type Props = z.infer<typeof Schema>; // consumer autocomplete
  const { variant, ...rest } = parseProps(Schema, Astro.props, { component: "Button" });
  ---
  ```
- Keep `makeStyleVars` / `mergeClasses` in `src/lib/utils/style.js` as-is (they're fine).
- Migrate the existing zod `forms-content-schema.js` to share the same z-helpers.
- Enable real type-checking: add `astro check` to scripts and CI (WS5).

### WS2 — Structure & exports

- **Delete the passthrough `index.astro` wrappers** (fixes A2 slot-dropping). Point the
  `exports` map and `lib/index.js` at the single real `Component.astro` for every
  component. One source per component.
- Keep the **barrel export names identical** (`Button`, `FormInput`, …) so consuming
  projects' imports don't change.
- Normalize the `content={{…}}` vs flat-prop split → flat props everywhere (fixes A7/C1).
- Optional (low risk, high clarity): rename the third atomic tier `components → organisms`
  in the scaffolder + docs; mirror atoms/molecules/organisms folders inside `lib/components`.

### WS3 — Token cleanup → theme contract for AI-driven theming _(scope confirmed; deferred until after the zod migration)_

**Audit finding (2026-06-29):** the architecture is already correct — `tokens.css` has a
3-tier structure (primitive `--color-*-rgb` → semantic `--color-accent`/`--color-surface`
→ component `--button-solid-bg: var(--color-accent)`), Button/Form component tokens are all
defined and derive from the semantic layer, and a working `[data-theme="dark"]` block already
overrides the semantic layer so components cascade automatically. The problem is **leaks and
an incomplete semantic layer**, not the design. Goal: make a new theme a single ~15-token
override block that Claude can generate and that can be contrast-validated mechanically.

1. **Plug the color leaks** — route every component-local hardcoded color through the semantic
   layer. Concentrated in **ComparisonSlider** (~20 literals) and **GoogleReviews** (~30),
   plus **Modal**/**Tooltip** (`#fff`/`#111`) and shadow/overlay `rgba(0,0,0,…)` in
   Form-Checkbox / Form-Upload / PhotoRoll. _Exception:_ genuine Google-brand colors in
   GoogleReviews stay hardcoded, clearly commented as brand (not themeable).
2. **Complete the semantic layer** — introduce a feedback color set
   (`--color-danger/success/warning/info` + AA-safe `*-contrast`/text variants); make
   `--alert-*-rgb` and `--form-error-color` (currently a raw `#c92a2a`) derive from it. This
   fixes the Alert `soft`-tone contrast bug (C11) and the form-error hardcode at the source.
3. **Define + document the theme contract** — the ~15 semantic tokens a theme MUST define,
   documented in `tokens.css` (commented block) and `CLAUDE.md` so Claude knows the exact
   names/intent. A theme = override that contract; nothing else.
4. **Complete the existing dark theme as the reference/validation theme** — extend the
   `[data-theme="dark"]` block to cover the full contract (incl. feedback colors). This is the
   proof the contract is complete and leak-free; it does **not** add a UI toggle (stays
   consistent with "no dark mode shipped yet").

**Enables the Claude theming workflow (see WS8):** Claude Design generates a palette → values
for the ~15 contract tokens (preview as a mockup); Claude Code writes
`[data-theme="brand-x"] { … }`, builds, screenshots every component in the theme, and runs
axe contrast checks on the contract's fg/bg pairs, then iterates. One block restyles all 32
components; contrast is mechanically verifiable.

### WS4 — Accessibility hardening (per-component fixes)

- **Image**: make `alt` required in the schema (or require explicit `alt=""` +
  `decorative` flag); dev-warn when missing. Fix `fetchpriority`/`loading` defaults
  (default `loading="lazy"`, `fetchpriority="auto"`; expose a `priority` flag for the LCP
  image). Remove the baked-in `picsum` default. (C2/C3/C4)
- **Accordion**: render panels open-by-default in CSS and _collapse via an `inert`/`hidden`
  attribute toggled in JS_, so no-JS users see content and closed panels are not focusable.
  Encourage `<h3><button>` trigger structure in docs. (C5/C6)
- **Button**: when `disabled` + `href`, render a `<button>` (or omit `href` +
  `tabindex="-1"` + `aria-disabled`) so it can't be activated. (C7)
- **Form-Label**: drop `aria-hidden` from the `visuallyHidden` span branch. (C8)
- **Form-Error**: use `role="alert"` _or_ `aria-live`, not both; default to a single
  consistent live-region strategy. (C9)
- **Alert**: give `soft` tone an accessible text token meeting 4.5:1 for all four types. (C11)
- **Tooltip**: enforce/ensure a focusable trigger (auto-add `tabindex="0"` when the slot's
  first element isn't natively focusable) and document the requirement. (C12)
- **Icon**: replace the regex "sanitizer" with a real allowlist sanitizer for the
  `svg`/`svgPath` paths, or restrict those props to build-time/trusted input and document
  it. (C14)

### WS5 — New composed Form `Field` (biggest forms win) _(C10)_

- Add `FormField` that owns one generated id and auto-wires `<FormLabel>`, `<FormInput>`
  (or select/textarea/etc.), `<FormHelp>`, `<FormError>`: sets `for`, `aria-describedby`
  (help+error), and `aria-invalid` automatically when an error is present.
- Keep the existing atomic Form-\* components exported for advanced/manual composition.

### WS6 — Deterministic IDs _(A5)_

- Replace `Math.random()` with a small `nextId(prefix)` util: a monotonic per-build
  counter (e.g. `form-input-1`) so builds are reproducible and snapshot/diff-stable, with
  consumer-supplied `id` always taking precedence. (Astro `.astro` components aren't
  hydrated, so there's no client mismatch concern — the wins are reproducibility +
  collision-safety on label↔control IDs.)

### WS7 — Quality guardrails _(A4/A8)_

- **Unit**: Vitest — test each component's zod schema (valid/invalid/default cases) and
  pure utils.
- **a11y**: `@axe-core/playwright` against the docs pages — one assertion per component,
  fail CI on violations. Add keyboard-walkthrough Playwright specs for Modal (focus trap +
  restore), Accordion (expand/collapse, no focus in closed panel), Tooltip (Esc dismiss),
  and a representative Form (error → `aria-describedby`/`aria-invalid`).
- **Lint**: ESLint + `eslint-plugin-astro` + `eslint-plugin-jsx-a11y` (Astro support),
  plus `astro check` for types. Keep Prettier.
- **CI**: add a `quality` job (lint → check → test → axe) that must pass **before** the
  existing build/FTP-deploy job. Reconsider `dangerous-clean-slate: true`.

### WS8 — Claude-assisted development workflow _(your 3rd question)_

See dedicated section below.

---

## Claude-assisted workflow integration ("Claude design")

You weren't sure whether/how to fold Claude into the component system. Highest-ROI order:

1. **Codify conventions in `CLAUDE.md` (do this first — it multiplies everything else).**
   A repo `CLAUDE.md` that states the non-negotiable patterns: zod `Schema` + `z.infer`
   Props, tokens-only colors (no hex), `nextId()` not random, the a11y checklist per
   component type, the Field-wiring rules. With this in place, anything Claude generates
   matches your system instead of fighting it. (You already have
   `.github/copilot-instructions.md` — consolidate into `CLAUDE.md`.)

2. **Upgrade the scaffolder into a Claude workflow.** Keep `create-component.js` for the
   file skeleton, but add a project skill / command (e.g. `/new-component`) that, given a
   name + description, generates: the `.astro` with a zod schema, a docs page, a token
   stub, and a Playwright+axe test — all following `CLAUDE.md`. This is where "tools have
   improved": scaffolding is no longer just empty files.

3. **Preview-driven visual iteration (the "design" loop).** Run `npm run dev`, then use
   Claude's browser/preview tooling (Claude-in-Chrome / preview MCP) to screenshot a
   component on the docs site, critique it visually, and iterate on the `.astro` + tokens.
   For brand-new components, start from a Claude-generated HTML/SVG mockup, agree on the
   visual, then port it into an Astro component + tokens. This replaces "guess CSS, rebuild,
   eyeball" with a tight see-adjust loop.

4. **Use the installed a11y skills as a gate.** Run the `accessibility` /
   `fixing-accessibility` skills on each component (and in PR review) so the WCAG checks in
   WS4 are repeatable, not one-off.

5. **Keep a human in the loop on tokens & API.** Let Claude draft components and tests;
   you own the token vocabulary and public prop API so the system stays coherent.

6. **Theme generation (unlocked by WS3's theme contract).** Ask Claude Design for a palette /
   visual concept → values for the ~15 contract tokens; have Claude Code apply it as a
   `[data-theme="brand-x"]` override, screenshot every component in the new theme, and run axe
   contrast checks on the fg/bg pairs before you ship. New themes become minutes-long,
   contrast-verified iterations instead of hand-editing dozens of files.

---

## Suggested sequencing (milestones)

- **v3.0-alpha** — WS1 (zod helper + migrate ~3 pilot components: Button, Image, Form-Input)
  - WS6 (`nextId`). Proves the pattern.
- **v3.0-beta** — WS2 (kill wrappers, unify exports) + WS3 (tokens) + WS7 (CI guardrails).
  Migrate remaining components to zod.
- **v3.0** — WS4 (a11y fixes) + WS5 (FormField). Full axe pass green.
- **v3.x** — WS8 polish (scaffolder skill, preview loop docs), optional organism rename.

Land the plan itself as `docs/PLAN-v3.md` in the repo as the first execution step (this
file is the working copy).

---

## Critical files

- `src/lib/utils/props.js` — replace `validateProps` → `parseProps` (zod) **[WS1]**
- `src/lib/index.js` + `package.json` `exports` — unify on `Component.astro` **[WS2]**
- `src/lib/components/*/index.astro` — **delete** (passthrough wrappers) **[WS2]**
- `src/lib/styles/tokens.css` — de-hardcode colors, add semantic/contrast tokens **[WS3]**
- `src/lib/components/{Image,Accordion,Button,Form-Label,Form-Error,Alert,Tooltip,Icon}/*.astro`
  — a11y fixes **[WS4]**
- `src/lib/components/Link/Link.astro` — fix `content`→`name` Icon call **[WS2/C1]**
- New `src/lib/components/FormField/FormField.astro` **[WS5]**
- New `src/lib/utils/id.js` (`nextId`) **[WS6]**
- New: `vitest.config`, `playwright.config`, `eslint.config`, CI `quality` job **[WS7]**
- New `CLAUDE.md` (consolidate `.github/copilot-instructions.md`) **[WS8]**

## Verification

- **Types**: `astro check` passes; open a consumer file and confirm prop autocomplete from
  `z.infer` Props.
- **Unit**: `vitest run` — schema accept/reject/default cases green.
- **a11y**: `@axe-core/playwright` over docs pages → 0 violations per component.
- **Keyboard** (Playwright + manual via dev server): Modal traps + restores focus and
  closes on Esc/backdrop; Accordion content is reachable with JS disabled and closed panels
  hold no focus; Tooltip dismisses on Esc; Form error wires `aria-describedby` + sets
  `aria-invalid`.
- **Contrast**: verify Alert `soft` warning/success ≥ 4.5:1 (axe + manual).
- **Visual**: `npm run dev`, screenshot each component via Claude preview tooling; confirm
  no visual regression after token changes.
- **Slots regression**: confirm `<Form>…children…</Form>` now renders children (was dropped
  by the deleted wrapper).
- **Consumer smoke test**: point one real Astro project at the v3 branch; build it; confirm
  imports resolve and pages render.

## Risks & mitigations

- **Export changes break consumers** → keep barrel names identical; do the wrapper removal
  in a single release with a short migration note; smoke-test against a real project.
- **zod runtime cost** → negligible for static output; `safeParse` + warn (not throw) keeps
  builds resilient.
- **Accordion no-JS rework** changes default markup expectations → document the new
  `inert`-based pattern; cover with the keyboard Playwright spec.
- **Scope creep across 28 components** → the alpha/beta/stable milestones keep each release
  shippable; pilot on 3 components before the bulk migration.
