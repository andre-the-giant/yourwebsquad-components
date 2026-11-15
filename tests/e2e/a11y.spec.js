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
  "/components/alert",
  "/components/tooltip",
  "/components/accordion",
  "/components/modal",
  "/components/form-input",
  "/components/formfield",
  "/components/band",
  "/components/breadcrumb",
  "/components/pagehero",
  "/components/facts",
  "/components/section",
  "/components/cardgrid",
  "/components/plans",
  "/components/datatable",
  "/components/steps",
  "/components/faq",
  "/components/proof",
  "/components/ctaband",
  "/components/siteheader",
  "/components/sitefooter",
  "/components/tag",
  "/components/form-radio",
  "/components/form-checkbox",
  "/components/map",
  "/components/hero",
  "/components/card",
  "/components/filterbar",
  "/components/googlerating",
  "/components/tableofcontents",
  "/components/contactcard",
  "/components/lightbox",
  "/components/review",
  "/components/stepbystepwizard",
  "/components/stickyactions",
  "/components/trustbar",
  "/components/priceticket",
  "/components/segmentedcontrol",
  "/components/marquee",
  "/components/noticebar",
  "/components/menuline",
  "/components/optionbuilder",
  "/components/visiblecaption"
];

const allPages = ["light", "plein-jour", "marbre", "chantier", "trattoria"].flatMap((theme) =>
  pages.map((path) => ({ path, theme }))
);

for (const { path, theme } of allPages) {
  test(`a11y (${theme}): ${path} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(`${path}?theme=${theme}`);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Scope to the library components — exclude docs-site chrome (nav, theme
      // toggle, syntax-highlighted code samples) which aren't part of the lib.
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
