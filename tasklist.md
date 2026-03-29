[x] Implement `StarRating` prop schema in `src/lib/components/StarRating/StarRating.astro`.
[x] Add `rating` prop to schema as `number`.
[x] Add `max` prop to schema as `number`.
[x] Add `size` prop to schema as `string`.
[x] Add `starSize` prop to schema as `string`.
[x] Add `filledColor` prop to schema as `string`.
[x] Add `emptyColor` prop to schema as `string`.
[x] Add `showValue` prop to schema as `boolean`.
[x] Add `srTemplate` prop to schema as `string`.
[x] Add `srText` prop to schema as `string`.
[x] Add `valueTemplate` prop to schema as `string`.
[x] Add `valueText` prop to schema as `string`.
[x] Keep support for shared props `id`, `class`, and `style`.
[x] Parse props and set default values for V1.
[x] Clamp raw `max` to a minimum of `1`.
[x] Clamp `rating` to `0..max`.
[x] Derive `isIntegerRating` from original input value.
[x] Format display rating with integer output when input is integer.
[x] Format display rating with 1 decimal when input is fractional.
[x] Compute numeric ratio `rating / max`.
[x] Compute fill percentage for partial stars from ratio.
[x] Compute stable `resolvedId` fallback.
[x] Build default SR string with template: `Rated {rating} out of {max}`.
[x] Implement SR template interpolation for `{rating}` and `{max}`.
[x] Implement `srText` override over `srTemplate`.
[x] Build default visible value string with template: `{rating}/{max}`.
[x] Implement value template interpolation for `{rating}` and `{max}`.
[x] Implement `valueText` override over `valueTemplate`.
[x] Implement size token map: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`.
[x] Resolve final star size from `starSize` override or size token.
[x] Build CSS variable map for star size and colors.
[x] Replace placeholder `<section>` content with actual stars markup.
[x] Render stars as decorative visuals (`aria-hidden="true"`).
[x] Render hidden SR text node for accessibility.
[x] Render visible value only when `showValue` is `true`.
[x] Implement fractional fill rendering that works in Safari/Chrome/Firefox/Edge.
[x] Ensure rendering does not depend on CSS `attr(data-rating number)`.
[x] Keep component strictly display-only (no interactive controls).
[x] Ensure stars-only visual output by default.
[x] Update component CSS for responsive behavior on small to large screens.
[x] Ensure no wrapping/overflow regressions at large star counts.
[x] Ensure default colors are Google-like (`#f4b400` filled, muted gray empty).
[x] Keep API and internals migration-friendly for future GoogleReviews replacement.
[x] Update `src/docs/pages/components/molecules/star-rating.astro` props table to new API.
[x] Add docs preview example for default stars-only usage.
[x] Add docs preview example for integer rating.
[x] Add docs preview example for fractional rating (0.1 precision).
[x] Add docs preview example for custom `max`.
[x] Add docs preview example for token size (`xs..xxl`).
[x] Add docs preview example for fixed `starSize`.
[x] Add docs preview example for custom filled/empty colors.
[x] Add docs preview example for visible numeric value (`showValue`).
[x] Add docs preview example for localized SR text (`srTemplate` or `srText`).
[x] Verify docs page builds without Astro/runtime errors.
[  ] Manual QA: check component in Chrome.
[  ] Manual QA: check component in Firefox.
[  ] Manual QA: check component in Safari.
[  ] Manual QA: check component in Edge.
[  ] Manual QA: check mobile viewport behavior.
[  ] Manual QA: check tablet viewport behavior.
[  ] Manual QA: check desktop/large-screen behavior.
[  ] Manual QA: validate clamping for `rating < 0`.
[  ] Manual QA: validate clamping for `rating > max`.
[  ] Manual QA: validate integer formatting behavior.
[  ] Manual QA: validate fractional formatting behavior.
[  ] Manual QA: validate SR text presence with screen reader tooling.
[  ] Manual QA: validate optional visible value toggle.
[  ] Manual QA: validate color customization.
[  ] Manual QA: validate size token customization.
[  ] Manual QA: validate fixed `starSize` override.
[x] Document precise GoogleReviews migration insertion points (notes only, no code changes).
[x] Final pass: ensure only StarRating/docs/tasklist files changed for this scope.

Migration notes for future GoogleReviews integration:
- Summary stars replacement point: `src/lib/components/GoogleReviews/GoogleReviews.astro:359` to `:370`
- Per-review stars replacement point: `src/lib/components/GoogleReviews/GoogleReviews.astro:407` to `:418`
- Summary SR text currently at: `src/lib/components/GoogleReviews/GoogleReviews.astro:371` to `:373`
- Per-review SR text currently at: `src/lib/components/GoogleReviews/GoogleReviews.astro:419`
- Existing star palette variables to map into `StarRating` props:
- `--googlereviews-star-color` and `--googlereviews-star-muted`

Scope verification notes:
- This implementation work touched StarRating component, StarRating docs page, and this task list.
- Pre-existing unrelated worktree changes were already present in `src/docs/data/components.js` and `src/lib/index.js`.
