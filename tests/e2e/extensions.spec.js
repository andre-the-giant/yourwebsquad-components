import { test, expect } from "@playwright/test";

// Behaviour of the 3.5.0 extensions and new components (chantier theme release).

test("SegmentedControl: arrows choose, the zone gets data-view, tickets follow", async ({
  page
}) => {
  await page.goto("/components/molecules/segmentedcontrol?theme=chantier");
  const group = page.getByRole("group", { name: "Show the price" });
  const day = group.getByRole("button", { name: "Per day" });
  const week = group.getByRole("button", { name: "Per week" });
  await expect(day).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#seg-demo")).toHaveAttribute("data-view", "day");

  await day.focus();
  await page.keyboard.press("ArrowRight");
  await expect(week).toBeFocused();
  await expect(week).toHaveAttribute("aria-pressed", "true");
  await expect(day).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#seg-demo")).toHaveAttribute("data-view", "week");
  // Only the chosen button is in the tab order
  await expect(day).toHaveAttribute("tabindex", "-1");
  await expect(page.locator("#seg-demo .priceticket__item.is-highlight").first()).toHaveAttribute(
    "data-key",
    "week"
  );
});

test("PriceTicket: a definition list with formatted amounts", async ({ page }) => {
  await page.goto("/components/molecules/priceticket?theme=chantier");
  const first = page.locator(".priceticket").first();
  await expect(first.locator("dt").first()).toHaveText("Day");
  await expect(first.locator("dd").first()).toContainText("$329");
  const fr = page.locator(".priceticket--lg").first();
  await expect(fr.locator("dd").nth(1)).toContainText("1 290 $");
});

test("Marquee: the pause button stops the text and says so", async ({ page }) => {
  await page.goto("/components/components/marquee?theme=chantier");
  const marquee = page.locator("[data-marquee]").first();
  const toggle = marquee.getByRole("button", { name: "Pause the scrolling text" });
  await expect(marquee.locator(".marquee__viewport")).toHaveAttribute("aria-hidden", "true");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(marquee).toHaveClass(/is-paused/);
  await expect(marquee.getByRole("button", { name: "Play the scrolling text" })).toBeVisible();
  await expect(marquee.locator(".marquee__track")).toHaveCSS("animation-play-state", "paused");
});

test("Marquee: still and without a button when reduced motion is asked", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/components/components/marquee?theme=chantier");
  const marquee = page.locator("[data-marquee]").first();
  await expect(marquee.locator(".marquee__track")).toHaveCSS("animation-name", "none");
  await expect(marquee.locator("[data-marquee-toggle]")).toBeHidden();
  await context.close();
});

test("NoticeBar: a named region, closing is remembered", async ({ page }) => {
  await page.goto("/components/components/noticebar?theme=chantier");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const bar = page.getByRole("region", { name: "Weather notice" });
  await bar.getByRole("button", { name: "Close the notice" }).click();
  await expect(bar).toBeHidden();
  await page.reload();
  await expect(page.getByRole("region", { name: "Weather notice" })).toBeHidden();
});

test("FilterBar groups: groups combine, counts follow, each keeps its parameter", async ({
  page
}) => {
  await page.goto("/components/molecules/filterbar?theme=chantier");
  const bar = page.locator('[data-target="fleet-demo"]');
  const visible = page.locator("#fleet-demo li:visible");
  await expect(visible).toHaveCount(5);
  await bar.getByRole("button", { name: /^Excavators/ }).click();
  await expect(visible).toHaveCount(3);
  await bar.getByRole("button", { name: /^Under 4 t/ }).click();
  await expect(visible).toHaveCount(2);
  await expect(bar.getByRole("status")).toHaveText("2 machines");
  await expect(page).toHaveURL(/cat=excavator/);
  await expect(page).toHaveURL(/weight=light/);
  // Counts of a group follow the other group's choice
  await expect(bar.getByRole("button", { name: /^4 t and more/ })).toContainText("1");
});

test("FilterBar groups: on a phone, the filters open in a dialog", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/components/molecules/filterbar?theme=chantier");
  const bar = page.locator('[data-target="fleet-demo"]');
  const opener = bar.getByRole("button", { name: /^Filters/ });
  await expect(opener).toBeVisible();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /^Loaders/ }).click();
  await expect(dialog.getByRole("button", { name: "Show 2 machines" })).toBeVisible();
  await dialog.getByRole("button", { name: "Show 2 machines" }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(opener).toContainText("· 1");
  await expect(page.locator("#fleet-demo li:visible")).toHaveCount(2);
});

test("StepByStepWizard: branches, fields and a line-by-line total", async ({ page }) => {
  await page.goto("/components/components/stepbystepwizard?theme=chantier");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const root = page.locator("#request-demo");
  // The focus stays put on page load
  await expect(page.locator("#request-demo legend:focus")).toHaveCount(0);
  await expect(root.locator("[data-counter]")).toContainText("Step 1 of 5");

  await root.getByText("Rent a machine").click();
  await root.getByRole("button", { name: "Continue" }).click();
  await expect(root.getByText("Which machine?")).toBeVisible();
  await root.getByText("Mini excavator 3.5 t").click();
  await root.getByRole("button", { name: "Continue" }).click();

  // A date in the past is refused
  await root.getByText("1 week").click();
  await root.getByLabel("Start date").fill("2020-01-01");
  await root.getByRole("button", { name: "Continue" }).click();
  await expect(root.getByText("The date must be today or later.")).toBeVisible();
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`;
  await root.getByLabel("Start date").fill(nextYear);
  await root.getByRole("button", { name: "Continue" }).click();

  // The postal code shows only with delivery, and is checked
  await expect(root.getByLabel(/Site postal code/)).toBeHidden();
  await root.getByText("Delivery by float truck").click();
  await root.getByLabel(/Site postal code/).fill("12345");
  await root.getByRole("button", { name: "Continue" }).click();
  await expect(root.getByText("Enter a postal code, such as K8N 4Z5.")).toBeVisible();
  await root.getByLabel(/Site postal code/).fill("K8N 4Z5");
  await root.getByRole("button", { name: "Continue" }).click();

  // "None" is exclusive
  await root.getByText("Damage protection (12 %)").click();
  await root.getByText("None", { exact: true }).click();
  await expect(root.getByLabel("Damage protection (12 %)")).not.toBeChecked();
  await root.getByText("Damage protection (12 %)").click();
  await expect(root.getByLabel("None", { exact: true })).not.toBeChecked();
  await root.getByRole("button", { name: "See the result" }).click();

  // 1 290 + 2 × 145 = 1 580, + 12 % = 1 769.60 → rounded to 1 770
  const total = root.locator("[data-sbs-result]:not([hidden])");
  await expect(total.locator("[data-figure]")).toHaveText("about $1,770");
  await expect(total.locator("[data-lines]")).toContainText("Mini excavator 3.5 t, 1 week");
  await expect(total.locator("[data-lines]")).toContainText("Delivery, 2 trips");
  await expect(root.locator("[data-sbs-summary]")).toContainText("K8N 4Z5");
});

test("StepByStepWizard: the works path skips the rental questions", async ({ page }) => {
  await page.goto("/components/components/stepbystepwizard?theme=chantier");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const root = page.locator("#request-demo");
  await root.getByText("Get work done").click();
  await root.getByRole("button", { name: "Continue" }).click();
  await expect(root.locator("[data-counter]")).toContainText("Step 2 of 3");
  await root.getByText("Septic system").click();
  await root.getByRole("button", { name: "Continue" }).click();
  await root.getByRole("button", { name: "See the result" }).click();
  const range = root.locator("[data-sbs-result]:not([hidden])");
  await expect(range.locator("[data-figure]")).toHaveText("$18,000 – $28,000");
  await expect(root.locator("[data-sbs-summary]")).not.toContainText("Machine");
});

test("StepByStepWizard: answers in the address fill the first steps", async ({ page }) => {
  await page.goto(
    "/components/components/stepbystepwizard?theme=chantier&service=rental&machine=mini-35"
  );
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const root = page.locator("#request-demo");
  await expect(root.getByText("When and for how long?")).toBeVisible();
  await expect(root.locator("[data-sbs-summary]")).toContainText("Mini excavator 3.5 t");
});

test("DataTable: rows stack in a narrow box and keep their column names", async ({ page }) => {
  await page.goto("/components/components/datatable?theme=chantier");
  const narrow = page.locator(".datatable--stack-sm").last();
  const cell = narrow.locator("tbody td").first();
  await expect(cell).toHaveCSS("display", "flex");
  await expect(cell).toHaveAttribute("data-label", "For whom");
  await expect(narrow.getByRole("table")).toBeVisible();
});

test("Button: slanted in chantier, the label stays upright", async ({ page }) => {
  await page.goto("/components/button?theme=chantier");
  const button = page.locator(".preview__frame .button--solid").first();
  const transforms = await button.evaluate((el) => ({
    button: getComputedStyle(el).transform,
    label: getComputedStyle(el.querySelector(".button__label")).transform
  }));
  expect(transforms.button).not.toBe("none");
  // skewX(-8deg) then skewX(8deg): the c values cancel out
  const c = (m) => Number(m.match(/matrix\(([^)]+)\)/)[1].split(",")[2]);
  expect(c(transforms.button) + c(transforms.label)).toBeCloseTo(0, 5);
});
