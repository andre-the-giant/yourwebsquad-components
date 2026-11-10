import { test, expect } from "@playwright/test";

// Behaviour of the 3.6.0 components (trattoria theme release).

test("MenuLine: price is plain text, leader is decorative, a link line is one target", async ({
  page
}) => {
  await page.goto("/components/molecules/menuline?theme=trattoria");
  const list = page.getByRole("list", { name: "Sauces", exact: true });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(list.getByRole("listitem").nth(1)).toContainText("Alfredo");
  await expect(list.locator(".menuline__leader").first()).toHaveAttribute("aria-hidden", "true");
  const clickable = page.getByRole("list", { name: "Large, clickable" });
  await expect(clickable.getByRole("link")).toHaveCount(3);
  // fr-CA: the price keeps a no-break space before the dollar sign
  await expect(clickable.locator(".menuline__price").first()).toHaveText("8 $");
});

test("OptionBuilder: the total waits for the required groups, then follows the choices", async ({
  page
}) => {
  await page.goto("/components/components/optionbuilder?theme=trattoria");
  const root = page.locator("[data-optionbuilder]").first();
  const total = root.locator("[data-ob-total]");
  const action = root.getByRole("link", { name: "Call to order" });
  await expect(total).toHaveText("–");
  await expect(action).toHaveAttribute("aria-disabled", "true");

  await root.getByText("Tagliatelle").click();
  await root.getByText("Alfredo", { exact: true }).click();
  await expect(total).toHaveText("–");
  await root.getByText("Regular · 350 g").click();
  await expect(total).toHaveText("$9");
  await expect(action).toHaveAttribute("aria-disabled", "false");
  await expect(root.locator('[data-ob-line="extras"]')).toHaveText("None");
  await expect(root.locator("[data-ob-live]")).toHaveText(
    "Total: $9. Tagliatelle, Alfredo, Regular · 350 g"
  );

  await root.getByText("Garlic bread").click();
  await expect(total).toHaveText("$11");
  await root.getByText("Large · 500 g").click();
  await expect(total).toHaveText("$14");

  await root.getByRole("button", { name: "Start over" }).click();
  await expect(total).toHaveText("–");
  await expect(root.locator('[data-ob-line="pasta"]')).toHaveText("–");
});

test("OptionBuilder: a disabled action does not navigate and focuses the first missing group", async ({
  page
}) => {
  await page.goto("/components/components/optionbuilder?theme=trattoria");
  const root = page.locator("[data-optionbuilder]").first();
  const before = page.url();
  await root.getByRole("link", { name: "Call to order" }).click({ force: true });
  expect(page.url()).toBe(before);
  await expect(root.locator('input[type="radio"]').first()).toBeFocused();
});

test("OptionBuilder: below 48rem the summary is a fixed bar and the toggle unfolds the details", async ({
  page
}) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/components/components/optionbuilder?theme=trattoria");
  const root = page.locator("[data-optionbuilder]").first();
  const summary = root.locator("[data-ob-summary]");
  await expect(summary).toHaveCSS("position", "fixed");
  const toggle = root.getByRole("button", { name: "See details" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(root.locator(".optionbuilder__details")).toBeHidden();
  await toggle.click();
  await expect(root.getByRole("button", { name: "Hide details" })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  await expect(root.locator(".optionbuilder__details")).toBeVisible();
});

test("VisibleCaption: the caption is visible without hover, on an opaque background", async ({
  page
}) => {
  await page.goto("/components/molecules/visiblecaption?theme=trattoria");
  const caption = page.locator(".visiblecaption__caption").first();
  await expect(caption).toBeVisible();
  const bg = await caption.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
});

test("VisibleCaption: a map point lights up its legend line", async ({ page }) => {
  await page.goto("/components/molecules/visiblecaption?theme=trattoria");
  const legend = page.getByRole("list", { name: "Suppliers and distance" });
  await expect(legend.locator("li[aria-current]")).toContainText("Cataraqui");
  await page.getByRole("button", { name: "Point 3" }).hover();
  await expect(legend.locator("li[aria-current]")).toContainText("Grain-d'Or");
  await page.getByRole("button", { name: "Point 2" }).focus();
  await expect(legend.locator("li[aria-current]")).toContainText("Sydenham");
});
