import { test, expect } from "@playwright/test";

// Behavioural checks for the WS4 keyboard/a11y fixes.

test("Accordion: panel content is in the DOM and closed panels are inert (C5/C6)", async ({
  page
}) => {
  await page.goto("/components/molecules/accordion");
  const panels = page.locator("[data-accordion-target]");
  expect(await panels.count()).toBeGreaterThan(0);

  // After hydration, any closed panel must be `inert` (not focusable / hidden
  // from AT) rather than aria-hidden with focusable children.
  const closed = page.locator('[data-accordion-target][data-accordion-state="closed"]');
  const closedCount = await closed.count();
  for (let i = 0; i < closedCount; i++) {
    await expect(closed.nth(i)).toHaveAttribute("inert", "");
  }
});

test("Tooltip: the trigger is keyboard-focusable (C12)", async ({ page }) => {
  await page.goto("/components/atoms/tooltip");
  const owner = page.locator("[data-tooltip-anchor] > *").first();
  await owner.waitFor();
  // Either natively focusable or given tabindex=0 by the component script.
  const focusable = await owner.evaluate(
    (el) =>
      el.matches("a[href], button, input, select, textarea, [tabindex]") ||
      el.getAttribute("tabindex") === "0"
  );
  expect(focusable).toBe(true);
});

test("Modal: native <dialog> closes on Escape (focus trap is built-in)", async ({ page }) => {
  await page.goto("/components/components/modal");
  const trigger = page.locator("[data-modal-open]").first();
  if ((await trigger.count()) === 0) test.skip(true, "no modal trigger on docs page");
  await trigger.click();
  const dialog = page.locator("dialog[open]").first();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
