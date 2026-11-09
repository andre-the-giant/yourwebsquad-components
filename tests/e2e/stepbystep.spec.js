import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/components/components/stepbystepwizard?theme=marbre");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("StepByStepWizard: start, error, back, result and summary", async ({ page }) => {
  const root = page.locator("#quote-demo");
  await root.getByRole("button", { name: "Start" }).click();

  // One question at a time, focus on the question
  await expect(root.getByText("Which room?")).toBeVisible();
  await expect(root.getByText("How big is it?")).toBeHidden();
  await expect(page.locator("#quote-demo legend:focus")).toHaveText("Which room?");
  await expect(root.locator("[data-counter]")).toContainText("Step 1 of 3");

  // Continue without an answer shows the error
  await root.getByRole("button", { name: "Continue" }).click();
  await expect(root.getByRole("alert").first()).toContainText("Choose an option to continue.");

  await root.getByText("Main bathroom").click();
  await root.getByRole("button", { name: "Continue" }).click();
  await root.getByText("Medium").click();
  await root.getByRole("button", { name: "Continue" }).click();

  // Back keeps the answer
  await root.getByRole("button", { name: "Back" }).click();
  await expect(root.getByLabel(/Medium/)).toBeChecked();
  await root.getByRole("button", { name: "Continue" }).click();

  // Summary shows the answers given so far
  const summary = root.locator("[data-sbs-summary]");
  await expect(summary).toContainText("Main bathroom");
  await expect(summary).toContainText("Medium");

  await root.getByText("Comfort").click();
  await root.getByRole("button", { name: "See my estimate" }).click();

  // Result: a price range and a duration, hidden fields filled
  const figure = root.locator("[data-figure]");
  await expect(figure).toHaveText(/\$18,000 – \$24,000/);
  await expect(root.locator("[data-duration]")).toHaveText("3 to 4 weeks");
  await expect(root.locator("input[data-stepbystep-result]")).toHaveValue("18000-24000");
  await expect(root.locator("input[data-stepbystep-answers]")).toHaveValue(/"finish":"comfort"/);
});

test("StepByStepWizard: an unfinished run can be resumed", async ({ page }) => {
  const root = page.locator("#quote-demo");
  await root.getByRole("button", { name: "Start" }).click();
  await root.getByText("Ensuite").click();
  await root.getByRole("button", { name: "Continue" }).click();
  await page.reload();
  await expect(root.locator("[data-resume]")).toBeVisible();
  await root.getByRole("button", { name: "Pick up where I left off" }).click();
  await expect(root.getByText("How big is it?")).toBeVisible();
});

test("FilterBar: filters the list, announces the count and keeps the URL", async ({ page }) => {
  await page.goto("/components/molecules/filterbar?theme=marbre");
  const bar = page.locator("[data-filterbar]").first();
  const list = page.locator("#filter-demo > li");
  await expect(list).toHaveCount(3);
  await bar.getByRole("button", { name: /Bathtub/ }).click();
  await expect(bar.getByRole("button", { name: /Bathtub/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.locator("#filter-demo > li:visible")).toHaveCount(1);
  await expect(bar.getByRole("status")).toHaveText("1 projects");
  await expect(page).toHaveURL(/type=tub/);
  await bar.getByRole("button", { name: /^All/ }).click();
  await expect(page.locator("#filter-demo > li:visible")).toHaveCount(3);
});

test("FilterBar: targets a CardGrid by its id and sorts by data-sort", async ({ page }) => {
  await page.goto("/components/molecules/filterbar?theme=marbre");
  const bar = page.locator("#grid-filter");
  const cards = page.locator("#grid-demo li");
  await expect(cards).toHaveCount(3);
  await bar.getByRole("button", { name: /Walk-in shower/ }).click();
  await expect(page.locator("#grid-demo li:visible")).toHaveCount(2);
  await bar.getByRole("button", { name: /^All/ }).click();
  await bar.getByLabel("Sort").selectOption("asc");
  await expect(cards.first()).toContainText("Williamsville");
  await bar.getByLabel("Sort").selectOption("desc");
  await expect(cards.first()).toContainText("Portsmouth");
});
