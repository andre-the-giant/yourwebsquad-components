import { test, expect } from "@playwright/test";

// The theme menu of the documentation, and the Plein jour button behaviour.
test("Theme menu switches the theme and remembers it", async ({ page }) => {
  await page.goto("/components/button");
  const select = page.getByLabel("Theme");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await select.selectOption("plein-jour");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "plein-jour");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "plein-jour");
  await expect(select).toHaveValue("plein-jour");
});

// Regression: Button's own :hover used the `background` shorthand, which reset the
// repeat, so the 5px line covered the whole button: dark text on a dark fill.
for (const variant of ["solid", "outline"]) {
  test(`Plein jour: ${variant} button hover keeps a single line`, async ({ page }) => {
    await page.goto("/components/button?theme=plein-jour");
    const button = page.locator(`.preview__frame .button--${variant}`).first();
    await button.hover();
    await expect(button).toHaveCSS("background-size", /100% 5px/);
    await expect(button).toHaveCSS("background-repeat", "no-repeat");
    await expect(button).toHaveCSS("background-position", /100%/);
  });
}
