import { test, expect } from "@playwright/test";

test.describe("Toast", () => {
  test("data-toast shows, announces and dismisses a message", async ({ page }) => {
    await page.goto("/components/toast");
    await page.getByRole("button", { name: "Success" }).click();

    const region = page.getByRole("region", { name: "Notifications" });
    await expect(region.getByText("Quote request sent")).toBeVisible();
    await expect(page.locator("[data-toast-polite]")).toHaveText("Quote request sent");

    await region.getByRole("button", { name: "Dismiss" }).click();
    await expect(region.getByText("Quote request sent")).toHaveCount(0);
  });

  test("danger goes to the assertive region and stays with duration 0", async ({ page }) => {
    await page.goto("/components/toast");
    await page.getByRole("button", { name: "Danger, stays" }).click();
    await expect(page.locator("[data-toast-assertive]")).toHaveText(/too large/);
    await page.waitForTimeout(5500);
    await expect(
      page.getByRole("region", { name: "Notifications" }).getByText(/too large/)
    ).toBeVisible();
  });

  test("keeps at most 3 toasts", async ({ page }) => {
    await page.goto("/components/toast");
    for (let i = 0; i < 5; i += 1) await page.getByRole("button", { name: "Info" }).click();
    await expect(page.locator(".toast:not(.is-leaving)")).toHaveCount(3);
  });
});

test.describe("StatsCounter", () => {
  test("ends on the final values, with the value in the HTML for screen readers", async ({
    page
  }) => {
    await page.goto("/components/statscounter");
    const first = page.locator(".stats").first();
    await first.scrollIntoViewIfNeeded();
    await expect(first.locator(".stats__sr").first()).toHaveText("25+");
    await expect(first.locator(".stats__number").nth(1)).toHaveText("1,200", { timeout: 4000 });
  });
});
