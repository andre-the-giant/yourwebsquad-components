import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Pages covering the components hardened in the v3 a11y pass (WS4) plus a few
// representative atoms. axe is run against WCAG 2.0/2.1 A + AA rules.
const pages = [
  "/",
  "/components/button",
  "/components/icon",
  "/components/link",
  "/components/image",
  "/components/molecules/alert",
  "/components/atoms/tooltip",
  "/components/molecules/accordion",
  "/components/components/modal",
  "/components/atoms/form-input",
  "/components/components/formfield"
];

for (const path of pages) {
  test(`a11y: ${path} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Scope to the library components — exclude docs-site chrome (nav, theme
      // toggle, syntax-highlighted code samples) which aren't part of the lib.
      .exclude(".theme-toggle")
      .exclude(".preview__code")
      .exclude("pre")
      .exclude("nav")
      .analyze();

    // Surface a readable summary if anything fails.
    expect(
      violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
      JSON.stringify(violations, null, 2)
    ).toEqual([]);
  });
}
