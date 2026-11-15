import { test, expect } from "@playwright/test";

test.describe("Docs sidebar search", () => {
  test("the search survives clicking a result", async ({ page }) => {
    await page.goto("/components/hero");
    const search = page.getByLabel("Search components");
    await search.fill("shader");

    const sidebar = page.locator(".sidebar");
    await sidebar.getByRole("link", { name: "ShaderBackground" }).click();
    await expect(page).toHaveURL(/\/components\/shaderbackground/);

    await expect(page.getByLabel("Search components")).toHaveValue("shader");
    await expect(sidebar.getByRole("link", { name: "ShaderBackground" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Accordion" })).toBeHidden();
  });

  test("clearing the field shows every component again on the next page", async ({ page }) => {
    await page.goto("/components/hero");
    const search = page.getByLabel("Search components");
    await search.fill("shader");
    await search.fill("");
    await page.goto("/components/ctaband");
    await expect(page.getByLabel("Search components")).toHaveValue("");
    await expect(page.locator(".sidebar").getByRole("link", { name: "Accordion" })).toBeVisible();
  });
});
